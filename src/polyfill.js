"use strict";

import { typeIsObject } from "./helpers";

import { ReadableStream } from "./readable-stream";
import { WritableStream } from "./writble-stream";
import { TransformStream } from "./transform-stream";

import ByteLengthQueuingStrategy from "./byte-length-queuing-strategy";
import CountQueuingStrategy from "./count-queuing-strategy";

const global = 
    typeof window !== "undefined" ? window :
    typeof self !== "undefined" ? self :
    typeof global !== "undefined" ? global : Function("return this")()
;

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

        const reader = this.reader();
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

    // overwrite instanceof
    ReadableStream[Symbol.hasInstance] = function (instance) {
        if(typeof this !== "function") {
            return false;
        }
        if(!typeIsObject(instance)) {
            return false;
        }

        // original instanceof
        if(instance instanceof OriginalReadableStream) {
            return true;
        }

        // polyfill instanceof
        const prototype = this.prototype;

        let proto = instance.__proto__;
        do {
            if(proto === prototype) return true;
        } while(proto = proto.__proto__);

        return false;
    };
    
    global.ReadableStream = ReadableStream;
    global.WritableStream = WritableStream;
    global.TransformStream = TransformStream;
}