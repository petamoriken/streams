"use strict";

import { ReadableStream } from "./readable-stream";
import { WritableStream } from "./writble-stream";
import { TransformStream } from "./transform-stream";

import ByteLengthQueuingStrategy from "./byte-length-queuing-strategy";
import CountQueuingStrategy from "./count-queuing-strategy";

ReadableStream.polyfill = true;

const global = (this || window).self || global;

const OriginalReadableStream = global.ReadableStream;

if(!OriginalReadableStream) {

    global.ReadableStream = ReadableStream;
    global.WritableStream = WritableStream;
    global.TransformStream = TransformStream;
    global.ByteLengthQueuingStrategy = ByteLengthQueuingStrategy;
    global.CountQueuingStrategy = CountQueuingStrategy;

} else if(!OriginalReadableStream.prototype.pipeTo) {

    // Fetch API uses Original ReadableStream
    const OriginalProto = OriginalReadableStream.prototype;
    OriginalProto.pipeTo = function pipeTo(dest, options) {
        if(!(this instanceof OriginalReadableStream)) {
            return Promise.reject(new TypeError("ReadableStream.prototype.pipeTo can only be used on a ReadableStream"));
        }
        if(!(dest instanceof WritableStream)) {
            return Promise.reject(new TypeError('ReadableStream.prototype.pipeTo\'s first argument must be a WritableStream'));
        }

        const reader = this.reader();
        const shim = new ReadableStream({
            async pull(controller) {
                const { value, done } = await reader.read();
                if(done) {
                    controller.close();
                }

                controller.enqueue(value);
            }
        });

        return shim.pipeTo(dest, options);
    };
    OriginalProto.pipeThrough = function pipeThrough({ writable, readable }, options) {
        this.pipeTo(writable, options);
        return readable;
    };

    global.ReadableStream = ReadableStream;
    global.WritableStream = WritableStream;
    global.TransformStream = TransformStream;
}