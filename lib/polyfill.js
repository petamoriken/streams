"use strict";

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _defineProperty = require("babel-runtime/core-js/object/define-property");

var _defineProperty2 = _interopRequireDefault(_defineProperty);

var _readableStream = require("./readable-stream");

var _writableStream = require("./writable-stream");

var _transformStream = require("./transform-stream");

var _byteLengthQueuingStrategy = require("./byte-length-queuing-strategy");

var _byteLengthQueuingStrategy2 = _interopRequireDefault(_byteLengthQueuingStrategy);

var _countQueuingStrategy = require("./count-queuing-strategy");

var _countQueuingStrategy2 = _interopRequireDefault(_countQueuingStrategy);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var OriginalReadableStream = global.ReadableStream;

function define(obj, key, value) {
    (0, _defineProperty2.default)(obj, key, {
        configurable: true,
        writable: true,
        value: value
    });
}

var _arr = [_readableStream.ReadableStream, _writableStream.WritableStream, _transformStream.TransformStream, _byteLengthQueuingStrategy2.default, _countQueuingStrategy2.default];
for (var _i = 0; _i < _arr.length; _i++) {
    var obj = _arr[_i];
    obj.polyfill = true;
    obj.original = null;
}

if (!OriginalReadableStream) {

    define(global, "ReadableStream", _readableStream.ReadableStream);
    define(global, "WritableStream", _writableStream.WritableStream);
    define(global, "TransformStream", _transformStream.TransformStream);
    define(global, "ByteLengthQueuingStrategy", _byteLengthQueuingStrategy2.default);
    define(global, "CountQueuingStrategy", _countQueuingStrategy2.default);

    // Chrome 43 ~
} else if (!OriginalReadableStream.prototype.pipeTo) {

    // update Original ReadableStream for Fetch API
    var OriginalProto = OriginalReadableStream.prototype;

    define(OriginalProto, "pipeTo", function pipeTo(dest, options) {
        if (!(this instanceof OriginalReadableStream)) {
            return _promise2.default.reject(new TypeError("ReadableStream.prototype.pipeTo can only be used on a ReadableStream"));
        }
        if (!(dest instanceof _writableStream.WritableStream)) {
            return _promise2.default.reject(new TypeError("ReadableStream.prototype.pipeTo's first argument must be a WritableStream"));
        }

        var reader = this.getReader();
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
    });

    define(OriginalProto, "pipeThrough", function pipeThrough(_ref3, options) {
        var writable = _ref3.writable,
            readable = _ref3.readable;

        this.pipeTo(writable, options);
        return readable;
    });

    _readableStream.ReadableStream.original = OriginalReadableStream;

    define(global, "ReadableStream", _readableStream.ReadableStream);
    define(global, "WritableStream", _writableStream.WritableStream);
    define(global, "TransformStream", _transformStream.TransformStream);
}