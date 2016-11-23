const assert = require("assert");
const webdriverio = require("webdriverio");

const browserify = require("browserify");

// chrome
const client = webdriverio.remote({
    desiredCapabilities: {
        browserName: 'chrome'
    },
    singleton: true
});

// polyfill
let polyfillCode = "";
const readable = browserify("lib/polyfill.js").bundle();
readable.on("data", text => {
    polyfillCode += text;
});
const polyfillPromise = new Promise(resolve => {
    readable.on("end", () => {
        resolve();
    });
});

describe("Fetch API test", function() {
    this.timeout(30000);

    before(async () => {
        await client.init()
            .timeouts("script", 30000)
            .url("http://petamoriken.github.io/streams/test/");
        
        await polyfillPromise;
        await client.execute(polyfillCode);
    });
    after(() => client.end());

    it("response.body (ReadableStream) has pipeTo/pipeThrough", async function() {
        const result = await client
            .executeAsync(function(done) {

                // browser code
                fetch("test.txt").then(response => {
                    let fetchText = "";
                    const decoder = new TextDecoder();

                    return response.body
                        .pipeThrough(new TransformStream({
                            transform(chunk, controller) {
                                controller.enqueue(chunk);
                            }
                        }))
                        .pipeTo(new WritableStream({
                            write(chunk) {
                                fetchText += decoder.decode(chunk);
                            }
                        })).then(() => fetchText);

                }).then(result => {
                    done(result);
                }).catch(e => {
                    done(e.message);
                });

            });
        
        assert.equal(result.value, "1234567890");
    });
});