"use strict";

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _readableStream = require("./readable-stream");

var _writbleStream = require("./writble-stream");

var _transformStream = require("./transform-stream");

var _byteLengthQueuingStrategy = require("./byte-length-queuing-strategy");

var _byteLengthQueuingStrategy2 = _interopRequireDefault(_byteLengthQueuingStrategy);

var _countQueuingStrategy = require("./count-queuing-strategy");

var _countQueuingStrategy2 = _interopRequireDefault(_countQueuingStrategy);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var global = (undefined || window).self || global;

var OriginalReadableStream = global.ReadableStream;

if (!OriginalReadableStream) {

    global.ReadableStream = _readableStream.ReadableStream;
    global.WritableStream = _writbleStream.WritableStream;
    global.TransformStream = _transformStream.TransformStream;
    global.ByteLengthQueuingStrategy = _byteLengthQueuingStrategy2.default;
    global.CountQueuingStrategy = _countQueuingStrategy2.default;
} else if (!OriginalReadableStream.prototype.pipeTo) {

    // Fetch API uses Original ReadableStream
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
            pull: function pull(controller) {
                var _this = this;

                return (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
                    var _ref, value, done;

                    return _regenerator2.default.wrap(function _callee$(_context) {
                        while (1) {
                            switch (_context.prev = _context.next) {
                                case 0:
                                    _context.next = 2;
                                    return reader.read();

                                case 2:
                                    _ref = _context.sent;
                                    value = _ref.value;
                                    done = _ref.done;

                                    if (done) {
                                        controller.close();
                                    }

                                    controller.enqueue(value);

                                case 7:
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
    OriginalProto.pipeThrough = function pipeThrough(_ref2, options) {
        var writable = _ref2.writable,
            readable = _ref2.readable;

        this.pipeTo(writable, options);
        return readable;
    };

    global.ReadableStream = _readableStream.ReadableStream;
    global.WritableStream = _writbleStream.WritableStream;
    global.TransformStream = _transformStream.TransformStream;
}