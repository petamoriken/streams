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
        await client.init().timeouts("script", 30000);
        await polyfillPromise;
    });
    after(() => client.end());

    it("Fetch API response.body (ReadableStream) has pipeTo/pipeThrough", async function() {
        const result = await client
            .url("http://moriken.kimamass.com/test/")
            .execute(polyfillCode)
            .executeAsync(function(done) {
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
                    done("Error!");
                });
            });
        
        assert.equal(result.value, "1234567890");
    });
});