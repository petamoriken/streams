"use strict";

import { typeIsObject } from "./helpers";

import { ReadableStream } from "./readable-stream";
import { WritableStream } from "./writable-stream";
import { TransformStream } from "./transform-stream";

import ByteLengthQueuingStrategy from "./byte-length-queuing-strategy";
import CountQueuingStrategy from "./count-queuing-strategy";

const OriginalReadableStream = global.ReadableStream;

if(!OriginalReadableStream) {

    ReadableStream.polyfill = true;

    global.ReadableStream = ReadableStream;
    global.WritableStream = WritableStream;
    global.TransformStream = TransformStream;
    global.ByteLengthQueuingStrategy = ByteLengthQueuingStrategy;
    global.CountQueuingStrategy = CountQueuingStrategy;

} else if(!OriginalReadableStream.prototype.pipeTo) {

    // update Original ReadableStream for Fetch API
    const OriginalProto = OriginalReadableStream.prototype;

    OriginalProto.pipeTo = function pipeTo(dest, options) {
        if(!(this instanceof OriginalReadableStream)) {
            return Promise.reject(new TypeError("ReadableStream.prototype.pipeTo can only be used on a ReadableStream"));
        }
        if(!(dest instanceof WritableStream)) {
            return Promise.reject(new TypeError('ReadableStream.prototype.pipeTo\'s first argument must be a WritableStream'));
        }

        const reader = this.getReader();
        const shim = new ReadableStream({
            start(controller) {
                (async () => {
                    for(;;) {
                        const { value, done } = await reader.read();
                        if(done) {
                            controller.close();
                            return;
                        }
                        controller.enqueue(value);
                    }
                })();
            }
        });

        return shim.pipeTo(dest, options);
    };

    OriginalProto.pipeThrough = function pipeThrough({ writable, readable }, options) {
        this.pipeTo(writable, options);
        return readable;
    };

    ReadableStream.polyfill = true;
    
    global.ReadableStream = ReadableStream;
    global.WritableStream = WritableStream;
    global.TransformStream = TransformStream;
}