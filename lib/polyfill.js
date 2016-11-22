"use strict";

var _hasInstance = require("babel-runtime/core-js/symbol/has-instance");

var _hasInstance2 = _interopRequireDefault(_hasInstance);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _helpers = require("./helpers");

var _readableStream = require("./readable-stream");

var _writbleStream = require("./writble-stream");

var _transformStream = require("./transform-stream");

var _byteLengthQueuingStrategy = require("./byte-length-queuing-strategy");

var _byteLengthQueuingStrategy2 = _interopRequireDefault(_byteLengthQueuingStrategy);

var _countQueuingStrategy = require("./count-queuing-strategy");

var _countQueuingStrategy2 = _interopRequireDefault(_countQueuingStrategy);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var global = typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : Function("return this")();

var OriginalReadableStream = global.ReadableStream;

if (!OriginalReadableStream) {

    _readableStream.ReadableStream.polyfill = true;

    global.ReadableStream = _readableStream.ReadableStream;
    global.WritableStream = _writbleStream.WritableStream;
    global.TransformStream = _transformStream.TransformStream;
    global.ByteLengthQueuingStrategy = _byteLengthQueuingStrategy2.default;
    global.CountQueuingStrategy = _countQueuingStrategy2.default;
} else if (!OriginalReadableStream.prototype.pipeTo) {

    // update Original ReadableStream for Fetch API
    var OriginalProto = OriginalReadableStream.prototype;

    OriginalProto.pipeTo = function pipeTo(dest, options) {
        if (!(this instanceof OriginalReadableStream)) {
            return _promise2.default.reject(new TypeError("ReadableStream.prototype.pipeTo can only be used on a ReadableStream"));
        }
        if (!(dest instanceof _writbleStream.WritableStream)) {
            return _promise2.default.reject(new TypeError('ReadableStream.prototype.pipeTo\'s first argument must be a WritableStream'));
        }

        var reader = this.reader();
        var shim = new _readableStream.ReadableStream({
            start: function start(controller) {
                var _this = this;

                (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
                    var _ref2, value, done;

                    return _regenerator2.default.wrap(function _callee$(_context) {
                        while (1) {
                            switch (_context.prev = _context.next) {
                                case 0:
                                    _context.next = 2;
                                    return reader.read();

                                case 2:
                                    _ref2 = _context.sent;
                                    value = _ref2.value;
                                    done = _ref2.done;

                                    if (!done) {
                                        _context.next = 8;
                                        break;
                                    }

                                    controller.close();
                                    return _context.abrupt("return");

                                case 8:
                                    controller.enqueue(value);

                                case 9:
                                    _context.next = 0;
                                    break;

                                case 11:
                                case "end":
                                    return _context.stop();
                            }
                        }
                    }, _callee, _this);
                }))();
            }
        });

        return shim.pipeTo(dest, options);
    };

    OriginalProto.pipeThrough = function pipeThrough(_ref3, options) {
        var writable = _ref3.writable,
            readable = _ref3.readable;

        this.pipeTo(writable, options);
        return readable;
    };

    _readableStream.ReadableStream.polyfill = true;

    // overwrite instanceof
    _readableStream.ReadableStream[_hasInstance2.default] = function (instance) {
        if (typeof this !== "function") {
            return false;
        }
        if (!(0, _helpers.typeIsObject)(instance)) {
            return false;
        }

        // original instanceof
        if (instance instanceof OriginalReadableStream) {
            return true;
        }

        // polyfill instanceof
        var prototype = this.prototype;

        var proto = instance.__proto__;
        do {
            if (proto === prototype) return true;
        } while (proto = proto.__proto__);

        return false;
    };

    global.ReadableStream = _readableStream.ReadableStream;
    global.WritableStream = _writbleStream.WritableStream;
    global.TransformStream = _transformStream.TransformStream;
}