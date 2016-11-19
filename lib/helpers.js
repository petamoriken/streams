'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _isNan = require('babel-runtime/core-js/number/is-nan');

var _isNan2 = _interopRequireDefault(_isNan);

var _defineProperty = require('babel-runtime/core-js/object/define-property');

var _defineProperty2 = _interopRequireDefault(_defineProperty);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var assert = require('assert');

function IsPropertyKey(argument) {
  return typeof argument === 'string' || (typeof argument === 'undefined' ? 'undefined' : (0, _typeof3.default)(argument)) === 'symbol';
}

exports.typeIsObject = function (x) {
  return (typeof x === 'undefined' ? 'undefined' : (0, _typeof3.default)(x)) === 'object' && x !== null || typeof x === 'function';
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

function Call(F, V, args) {
  if (typeof F !== 'function') {
    throw new TypeError('Argument is not a function');
  }

  return Function.prototype.apply.call(F, V, args);
}

exports.InvokeOrNoop = function (O, P, args) {
  assert(O !== undefined);
  assert(IsPropertyKey(P));
  assert(Array.isArray(args));

  var method = O[P];
  if (method === undefined) {
    return undefined;
  }

  return Call(method, O, args);
};

exports.PromiseInvokeOrNoop = function (O, P, args) {
  assert(O !== undefined);
  assert(IsPropertyKey(P));
  assert(Array.isArray(args));
  try {
    return _promise2.default.resolve(exports.InvokeOrNoop(O, P, args));
  } catch (returnValueE) {
    return _promise2.default.reject(returnValueE);
  }
};

exports.PromiseInvokeOrPerformFallback = function (O, P, args, F, argsF) {
  assert(O !== undefined);
  assert(IsPropertyKey(P));
  assert(Array.isArray(args));
  assert(Array.isArray(argsF));

  var method = void 0;
  try {
    method = O[P];
  } catch (methodE) {
    return _promise2.default.reject(methodE);
  }

  if (method === undefined) {
    return F.apply(undefined, (0, _toConsumableArray3.default)(argsF));
  }

  try {
    return _promise2.default.resolve(Call(method, O, args));
  } catch (e) {
    return _promise2.default.reject(e);
  }
};

exports.PromiseInvokeOrFallbackOrNoop = function (O, P1, args1, P2, args2) {
  assert(O !== undefined);
  assert(IsPropertyKey(P1));
  assert(Array.isArray(args1));
  assert(IsPropertyKey(P2));
  assert(Array.isArray(args2));

  return exports.PromiseInvokeOrPerformFallback(O, P1, args1, exports.PromiseInvokeOrNoop, [O, P2, args2]);
};

// Not implemented correctly
exports.SameRealmTransfer = function (O) {
  return O;
};

exports.ValidateAndNormalizeHighWaterMark = function (highWaterMark) {
  highWaterMark = Number(highWaterMark);
  if ((0, _isNan2.default)(highWaterMark) || highWaterMark < 0) {
    throw new RangeError('highWaterMark property of a queuing strategy must be non-negative and non-NaN');
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