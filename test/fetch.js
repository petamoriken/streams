const fs = require("fs");

const assert = require("assert");
const webdriverio = require("webdriverio");

// chrome
const client = webdriverio.remote({
    desiredCapabilities: {
        browserName: 'chrome'
    },
    singleton: true
});

// polyfill
const polyfillPromise = new Promise((resolve, reject) => {
    fs.readFile("browser/streams.min.opt.js", "utf8", (err, data) => {
        if(err) reject(err);
        resolve(data);
    });
});

const uri = "http://petamoriken.github.io/streams/test/";


describe("Fetch API response.body test in Chrome", function() {
    this.timeout(20000);

    let polyfillCode;

    before(async () => {
        await client.init()
            .timeouts("script", 5000)
            .url(uri);
        
        polyfillCode = await polyfillPromise;
    });
    after(() => client.end());

    it("append polyfill", async function() {
        await client.execute(polyfillCode);
    });

    it("response.body enable to use pipeTo/pipeThrough", async function() {
        const result = await client
            .executeAsync(function(done) {

                // in browser
                fetch("test.txt").then(response => {
                    let fetchText = "";
                    const decoder = new TextDecoder();

                    return response.body.pipeThrough(new TransformStream({
                            transform(chunk, controller) {
                                controller.enqueue( chunk.map(val => val + 1) );
                            }
                        })).pipeTo(new WritableStream({
                            write(chunk) {
                                fetchText += decoder.decode(chunk);
                            }
                        })).then(() => fetchText);
                }).then(done).catch(e => done(e.message));

            });

        assert.equal(result.value, "23456789:1");
    });
});