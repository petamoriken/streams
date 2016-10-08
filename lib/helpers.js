'use strict';

var _isNan = require('babel-runtime/core-js/number/is-nan');

var _isNan2 = _interopRequireDefault(_isNan);

var _defineProperty = require('babel-runtime/core-js/object/define-property');

var _defineProperty2 = _interopRequireDefault(_defineProperty);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var assert = require('assert');

exports.promiseCall = function (func) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  try {
    return _promise2.default.resolve(func.apply(undefined, args));
  } catch (e) {
    return _promise2.default.reject(e);
  }
};

exports.typeIsObject = function (x) {
  return (typeof x === 'undefined' ? 'undefined' : (0, _typeof3.default)(x)) === 'object' && x !== null || typeof x === 'function';
};

exports.toInteger = function (v) {
  v = Number(v);
  if (isNaN(v)) {
    return 0;
  }

  if (v < 0) {
    return -1 * Math.floor(Math.abs(v));
  }

  return Math.floor(Math.abs(v));
};

exports.createDataProperty = function (o, p, v) {
  assert(exports.typeIsObject(o));
  (0, _defineProperty2.default)(o, p, { value: v, writable: true, enumerable: true, configurable: true });
};

exports.createArrayFromList = function (elements) {
  // We use arrays to represent lists, so this is basically a no-op.
  // Do a slice though just in case we happen to depend on the unique-ness.
  return elements.slice();
};

exports.ArrayBufferCopy = function (dest, destOffset, src, srcOffset, n) {
  new Uint8Array(dest).set(new Uint8Array(src, srcOffset, n), destOffset);
};

exports.CreateIterResultObject = function (value, done) {
  assert(typeof done === 'boolean');
  var obj = {};
  Object.defineProperty(obj, 'value', { value: value, enumerable: true, writable: true, configurable: true });
  Object.defineProperty(obj, 'done', { value: done, enumerable: true, writable: true, configurable: true });
  return obj;
};

exports.IsFiniteNonNegativeNumber = function (v) {
  if ((0, _isNan2.default)(v)) {
    return false;
  }
  if (v === Infinity) {
    return false;
  }
  if (v < 0) {
    return false;
  }

  return true;
};

exports.InvokeOrNoop = function (O, P, args) {
  var method = O[P];
  if (method === undefined) {
    return undefined;
  }
  return method.apply(O, args);
};

exports.PromiseInvokeOrNoop = function (O, P, args) {
  var method = void 0;
  try {
    method = O[P];
  } catch (methodE) {
    return _promise2.default.reject(methodE);
  }

  if (method === undefined) {
    return _promise2.default.resolve(undefined);
  }

  try {
    return _promise2.default.resolve(method.apply(O, args));
  } catch (e) {
    return _promise2.default.reject(e);
  }
};

exports.PromiseInvokeOrFallbackOrNoop = function (O, P1, args1, P2, args2) {
  var method = void 0;
  try {
    method = O[P1];
  } catch (methodE) {
    return _promise2.default.reject(methodE);
  }

  if (method === undefined) {
    return exports.PromiseInvokeOrNoop(O, P2, args2);
  }

  try {
    return _promise2.default.resolve(method.apply(O, args1));
  } catch (e) {
    return _promise2.default.reject(e);
  }
};

// Not implemented correctly
exports.SameRealmTransfer = function (O) {
  return O;
};

exports.ValidateAndNormalizeHighWaterMark = function (highWaterMark) {
  highWaterMark = Number(highWaterMark);
  if ((0, _isNan2.default)(highWaterMark) || highWaterMark < 0) {
    throw new RangeError('highWaterMark property of a queuing strategy must be nonnegative and non-NaN');
  }

  return highWaterMark;
};

exports.ValidateAndNormalizeQueuingStrategy = function (size, highWaterMark) {
  if (size !== undefined && typeof size !== 'function') {
    throw new TypeError('size property of a queuing strategy must be a function');
  }

  highWaterMark = exports.ValidateAndNormalizeHighWaterMark(highWaterMark);

  return { size: size, highWaterMark: highWaterMark };
};