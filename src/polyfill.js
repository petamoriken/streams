"use strict";

import { ReadableStream } from "./readable-stream";
import { WritableStream } from "./writable-stream";
import { TransformStream } from "./transform-stream";

import ByteLengthQueuingStrategy from "./byte-length-queuing-strategy";
import CountQueuingStrategy from "./count-queuing-strategy";

const OriginalReadableStream = global.ReadableStream;

function define(obj, key, value) {
    Object.defineProperty(obj, key, {
        configurable: true,
        writable: true,
        value
    });
}

for(const obj of [ReadableStream, WritableStream, TransformStream, ByteLengthQueuingStrategy, CountQueuingStrategy]) {
    obj.polyfill = true;
    obj.original = null;
}

if(!OriginalReadableStream) {

    define(global, "ReadableStream", ReadableStream);
    define(global, "WritableStream", WritableStream);
    define(global, "TransformStream", TransformStream);
    define(global, "ByteLengthQueuingStrategy", ByteLengthQueuingStrategy);
    define(global, "CountQueuingStrategy", CountQueuingStrategy);

// Chrome 43 ~
} else if(!OriginalReadableStream.prototype.pipeTo) {

    // update Original ReadableStream for Fetch API
    const OriginalProto = OriginalReadableStream.prototype;

    define(OriginalProto, "pipeTo", function pipeTo(dest, options) {
        if(!(this instanceof OriginalReadableStream)) {
            return Promise.reject(new TypeError("ReadableStream.prototype.pipeTo can only be used on a ReadableStream"));
        }
        if(!(dest instanceof WritableStream)) {
            return Promise.reject(new TypeError("ReadableStream.prototype.pipeTo's first argument must be a WritableStream"));
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
    });

    define(OriginalProto, "pipeThrough", function pipeThrough({ writable, readable }, options) {
        this.pipeTo(writable, options);
        return readable;
    });

    ReadableStream.original = OriginalReadableStream;
    
    define(global, "ReadableStream", ReadableStream);
    define(global, "WritableStream", WritableStream);
    define(global, "TransformStream", TransformStream);
}