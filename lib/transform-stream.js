'use strict';

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var assert = require('assert');

var _require = require('./helpers.js'),
    InvokeOrNoop = _require.InvokeOrNoop,
    PromiseInvokeOrPerformFallback = _require.PromiseInvokeOrPerformFallback,
    PromiseInvokeOrNoop = _require.PromiseInvokeOrNoop,
    typeIsObject = _require.typeIsObject;

var _require2 = require('./readable-stream.js'),
    ReadableStream = _require2.ReadableStream,
    ReadableStreamDefaultControllerClose = _require2.ReadableStreamDefaultControllerClose,
    ReadableStreamDefaultControllerEnqueue = _require2.ReadableStreamDefaultControllerEnqueue,
    ReadableStreamDefaultControllerError = _require2.ReadableStreamDefaultControllerError,
    ReadableStreamDefaultControllerGetDesiredSize = _require2.ReadableStreamDefaultControllerGetDesiredSize;

var _require3 = require('./writable-stream.js'),
    WritableStream = _require3.WritableStream,
    WritableStreamDefaultControllerError = _require3.WritableStreamDefaultControllerError;

// Methods on the transform stream controller object

function TransformStreamCloseReadable(transformStream) {
  // console.log('TransformStreamCloseReadable()');

  if (transformStream._errored === true) {
    throw new TypeError('TransformStream is already errored');
  }

  if (transformStream._readableClosed === true) {
    throw new TypeError('Readable side is already closed');
  }

  TransformStreamCloseReadableInternal(transformStream);
}

function TransformStreamEnqueueToReadable(transformStream, chunk) {
  // console.log('TransformStreamEnqueueToReadable()');

  if (transformStream._errored === true) {
    throw new TypeError('TransformStream is already errored');
  }

  if (transformStream._readableClosed === true) {
    throw new TypeError('Readable side is already closed');
  }

  // We throttle transformer.transform invocation based on the backpressure of the ReadableStream, but we still
  // accept TransformStreamEnqueueToReadable() calls.

  var controller = transformStream._readableController;

  try {
    ReadableStreamDefaultControllerEnqueue(controller, chunk);
  } catch (e) {
    // This happens when readableStrategy.size() throws.
    // The ReadableStream has already errored itself.
    transformStream._readableClosed = true;
    TransformStreamErrorIfNeeded(transformStream, e);

    throw transformStream._storedError;
  }

  var desiredSize = ReadableStreamDefaultControllerGetDesiredSize(controller);
  var maybeBackpressure = desiredSize <= 0;

  if (maybeBackpressure === true && transformStream._backpressure === false) {
    // This allows pull() again. When desiredSize is 0, it's possible that a pull() will happen immediately (but
    // asynchronously) after this because of pending read()s and set _backpressure back to false.
    //
    // If pull() could be called from inside enqueue(), then this logic would be wrong. This cannot happen
    // because there is always a promise pending from start() or pull() when _backpressure is false.
    TransformStreamSetBackpressure(transformStream, true);
  }
}

function TransformStreamError(transformStream, e) {
  if (transformStream._errored === true) {
    throw new TypeError('TransformStream is already errored');
  }

  TransformStreamErrorInternal(transformStream, e);
}

// Abstract operations.

function TransformStreamCloseReadableInternal(transformStream) {
  assert(transformStream._errored === false);
  assert(transformStream._readableClosed === false);

  try {
    ReadableStreamDefaultControllerClose(transformStream._readableController);
  } catch (e) {
    assert(false);
  }

  transformStream._readableClosed = true;
}

function TransformStreamErrorIfNeeded(transformStream, e) {
  if (transformStream._errored === false) {
    TransformStreamErrorInternal(transformStream, e);
  }
}

function TransformStreamErrorInternal(transformStream, e) {
  // console.log('TransformStreamErrorInternal()');

  assert(transformStream._errored === false);

  transformStream._errored = true;
  transformStream._storedError = e;

  if (transformStream._writableDone === false) {
    WritableStreamDefaultControllerError(transformStream._writableController, e);
  }
  if (transformStream._readableClosed === false) {
    ReadableStreamDefaultControllerError(transformStream._readableController, e);
  }
}

// Used for preventing the next write() call on TransformStreamSink until there
// is no longer backpressure.
function TransformStreamReadableReadyPromise(transformStream) {
  assert(transformStream._backpressureChangePromise !== undefined, '_backpressureChangePromise should have been initialized');

  if (transformStream._backpressure === false) {
    return _promise2.default.resolve();
  }

  assert(transformStream._backpressure === true, '_backpressure should have been initialized');

  return transformStream._backpressureChangePromise;
}

function TransformStreamSetBackpressure(transformStream, backpressure) {
  // console.log(`TransformStreamSetBackpressure(${backpressure})`);

  // Passes also when called during construction.
  assert(transformStream._backpressure !== backpressure, 'TransformStreamSetBackpressure() should be called only when backpressure is changed');

  if (transformStream._backpressureChangePromise !== undefined) {
    // The fulfillment value is just for a sanity check.
    transformStream._backpressureChangePromise_resolve(backpressure);
  }

  transformStream._backpressureChangePromise = new _promise2.default(function (resolve) {
    transformStream._backpressureChangePromise_resolve = resolve;
  });

  transformStream._backpressureChangePromise.then(function (resolution) {
    assert(resolution !== backpressure, '_backpressureChangePromise should be fulfilled only when backpressure is changed');
  });

  transformStream._backpressure = backpressure;
}

function TransformStreamDefaultTransform(chunk, transformStreamController) {
  var transformStream = transformStreamController._controlledTransformStream;
  TransformStreamEnqueueToReadable(transformStream, chunk);
  return _promise2.default.resolve();
}

function TransformStreamTransform(transformStream, chunk) {
  // console.log('TransformStreamTransform()');

  assert(transformStream._errored === false);
  assert(transformStream._transforming === false);
  assert(transformStream._backpressure === false);

  transformStream._transforming = true;

  var transformer = transformStream._transformer;
  var controller = transformStream._transformStreamController;

  var transformPromise = PromiseInvokeOrPerformFallback(transformer, 'transform', [chunk, controller], TransformStreamDefaultTransform, [chunk, controller]);

  return transformPromise.then(function () {
    transformStream._transforming = false;

    return TransformStreamReadableReadyPromise(transformStream);
  }, function (e) {
    return TransformStreamErrorIfNeeded(transformStream, e);
  });
}

function IsTransformStreamDefaultController(x) {
  if (!typeIsObject(x)) {
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(x, '_controlledTransformStream')) {
    return false;
  }

  return true;
}

function IsTransformStream(x) {
  if (!typeIsObject(x)) {
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(x, '_transformStreamController')) {
    return false;
  }

  return true;
}

var TransformStreamSink = function () {
  function TransformStreamSink(transformStream, startPromise) {
    (0, _classCallCheck3.default)(this, TransformStreamSink);

    this._transformStream = transformStream;
    this._startPromise = startPromise;
  }

  (0, _createClass3.default)(TransformStreamSink, [{
    key: 'start',
    value: function start(c) {
      var transformStream = this._transformStream;

      transformStream._writableController = c;

      return this._startPromise.then(function () {
        return TransformStreamReadableReadyPromise(transformStream);
      });
    }
  }, {
    key: 'write',
    value: function write(chunk) {
      // console.log('TransformStreamSink.write()');

      var transformStream = this._transformStream;

      return TransformStreamTransform(transformStream, chunk);
    }
  }, {
    key: 'abort',
    value: function abort() {
      var transformStream = this._transformStream;
      transformStream._writableDone = true;
      TransformStreamErrorInternal(transformStream, new TypeError('Writable side aborted'));
    }
  }, {
    key: 'close',
    value: function close() {
      // console.log('TransformStreamSink.close()');

      var transformStream = this._transformStream;

      assert(transformStream._transforming === false);

      transformStream._writableDone = true;

      var flushPromise = PromiseInvokeOrNoop(transformStream._transformer, 'flush', [transformStream._transformStreamController]);
      // Return a promise that is fulfilled with undefined on success.
      return flushPromise.then(function () {
        if (transformStream._errored === true) {
          return _promise2.default.reject(transformStream._storedError);
        }
        if (transformStream._readableClosed === false) {
          TransformStreamCloseReadableInternal(transformStream);
        }
        return _promise2.default.resolve();
      }).catch(function (r) {
        TransformStreamErrorIfNeeded(transformStream, r);
        return _promise2.default.reject(transformStream._storedError);
      });
    }
  }]);
  return TransformStreamSink;
}();

var TransformStreamSource = function () {
  function TransformStreamSource(transformStream, startPromise) {
    (0, _classCallCheck3.default)(this, TransformStreamSource);

    this._transformStream = transformStream;
    this._startPromise = startPromise;
  }

  (0, _createClass3.default)(TransformStreamSource, [{
    key: 'start',
    value: function start(c) {
      var transformStream = this._transformStream;

      transformStream._readableController = c;

      return this._startPromise.then(function () {
        // Prevent the first pull() call until there is backpressure.

        assert(transformStream._backpressureChangePromise !== undefined, '_backpressureChangePromise should have been initialized');

        if (transformStream._backpressure === true) {
          return _promise2.default.resolve();
        }

        assert(transformStream._backpressure === false, '_backpressure should have been initialized');

        return transformStream._backpressureChangePromise;
      });
    }
  }, {
    key: 'pull',
    value: function pull() {
      // console.log('TransformStreamSource.pull()');

      var transformStream = this._transformStream;

      // Invariant. Enforced by the promises returned by start() and pull().
      assert(transformStream._backpressure === true, 'pull() should be never called while _backpressure is false');

      assert(transformStream._backpressureChangePromise !== undefined, '_backpressureChangePromise should have been initialized');

      TransformStreamSetBackpressure(transformStream, false);

      // Prevent the next pull() call until there is backpressure.
      return transformStream._backpressureChangePromise;
    }
  }, {
    key: 'cancel',
    value: function cancel() {
      var transformStream = this._transformStream;
      transformStream._readableClosed = true;
      TransformStreamErrorInternal(transformStream, new TypeError('Readable side canceled'));
    }
  }]);
  return TransformStreamSource;
}();

var TransformStreamDefaultController = function () {
  function TransformStreamDefaultController(transformStream) {
    (0, _classCallCheck3.default)(this, TransformStreamDefaultController);

    if (IsTransformStream(transformStream) === false) {
      throw new TypeError('TransformStreamDefaultController can only be ' + 'constructed with a TransformStream instance');
    }

    if (transformStream._transformStreamController !== undefined) {
      throw new TypeError('TransformStreamDefaultController instances can ' + 'only be created by the TransformStream constructor');
    }

    this._controlledTransformStream = transformStream;
  }

  (0, _createClass3.default)(TransformStreamDefaultController, [{
    key: 'enqueue',
    value: function enqueue(chunk) {
      if (IsTransformStreamDefaultController(this) === false) {
        throw defaultControllerBrandCheckException('enqueue');
      }

      TransformStreamEnqueueToReadable(this._controlledTransformStream, chunk);
    }
  }, {
    key: 'close',
    value: function close() {
      if (IsTransformStreamDefaultController(this) === false) {
        throw defaultControllerBrandCheckException('close');
      }

      TransformStreamCloseReadable(this._controlledTransformStream);
    }
  }, {
    key: 'error',
    value: function error(reason) {
      if (IsTransformStreamDefaultController(this) === false) {
        throw defaultControllerBrandCheckException('error');
      }

      TransformStreamError(this._controlledTransformStream, reason);
    }
  }, {
    key: 'desiredSize',
    get: function get() {
      if (IsTransformStreamDefaultController(this) === false) {
        throw defaultControllerBrandCheckException('desiredSize');
      }

      var transformStream = this._controlledTransformStream;
      var readableController = transformStream._readableController;

      return ReadableStreamDefaultControllerGetDesiredSize(readableController);
    }
  }]);
  return TransformStreamDefaultController;
}();

var TransformStream = function () {
  function TransformStream() {
    var transformer = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, TransformStream);

    this._transformer = transformer;
    var readableStrategy = transformer.readableStrategy,
        writableStrategy = transformer.writableStrategy;


    this._transforming = false;
    this._errored = false;
    this._storedError = undefined;

    this._writableController = undefined;
    this._readableController = undefined;
    this._transformStreamController = undefined;

    this._writableDone = false;
    this._readableClosed = false;

    this._backpressure = undefined;
    this._backpressureChangePromise = undefined;
    this._backpressureChangePromise_resolve = undefined;

    this._transformStreamController = new TransformStreamDefaultController(this);

    var startPromise_resolve = void 0;
    var startPromise = new _promise2.default(function (resolve) {
      startPromise_resolve = resolve;
    });

    var source = new TransformStreamSource(this, startPromise);

    this._readable = new ReadableStream(source, readableStrategy);

    var sink = new TransformStreamSink(this, startPromise);

    this._writable = new WritableStream(sink, writableStrategy);

    assert(this._writableController !== undefined);
    assert(this._readableController !== undefined);

    var desiredSize = ReadableStreamDefaultControllerGetDesiredSize(this._readableController);
    // Set _backpressure based on desiredSize. As there is no read() at this point, we can just interpret
    // desiredSize being non-positive as backpressure.
    TransformStreamSetBackpressure(this, desiredSize <= 0);

    var transformStream = this;
    var startResult = InvokeOrNoop(transformer, 'start', [transformStream._transformStreamController]);
    startPromise_resolve(startResult);
    startPromise.catch(function (e) {
      // The underlyingSink and underlyingSource will error the readable and writable ends on their own.
      if (transformStream._errored === false) {
        transformStream._errored = true;
        transformStream._storedError = e;
      }
    });
  }

  (0, _createClass3.default)(TransformStream, [{
    key: 'readable',
    get: function get() {
      if (IsTransformStream(this) === false) {
        throw streamBrandCheckException('readable');
      }

      return this._readable;
    }
  }, {
    key: 'writable',
    get: function get() {
      if (IsTransformStream(this) === false) {
        throw streamBrandCheckException('writable');
      }

      return this._writable;
    }
  }]);
  return TransformStream;
}();

module.exports = { TransformStream: TransformStream };

// Helper functions for the TransformStreamDefaultController.

function defaultControllerBrandCheckException(name) {
  return new TypeError('TransformStreamDefaultController.prototype.' + name + ' can only be used on a TransformStreamDefaultController');
}

// Helper functions for the TransformStream.

function streamBrandCheckException(name) {
  return new TypeError('TransformStream.prototype.' + name + ' can only be used on a TransformStream');
}