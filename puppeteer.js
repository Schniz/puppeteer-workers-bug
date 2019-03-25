const puppeteer = require("puppeteer");
const express = require("express");

/**
 * @param {import('puppeteer').Browser} browser
 */
async function run(browser, interceptionMethod) {
  const page = await browser.newPage();

  if (interceptionMethod === "puppeteer") {
    await page.setRequestInterception(true);
    await page.on("request", request => request.continue());
  } else if (interceptionMethod === "cdp") {
    await cdpInterception(page);
  }

  await page.exposeFunction("__log__", value => console.log(value));
  await page.goto("http://localhost:5000/");
  await new Promise(r => setTimeout(r, 2000));

  await page.close();
}

function serve() {
  const app = express();
  app.use(express.static(__dirname));
  return app.listen(5000);
}

(async () => {
  const server = serve();
  const browser = await puppeteer.launch();

  console.log("The following works:");
  console.log("--------------------");
  await run(browser, null);

  console.log();
  console.log("But when intercepted, it doesn't!");
  console.log("--------------------------");
  await run(browser, "puppeteer");

  console.log();
  console.log("Although it does work with CDP directly:");
  console.log("----------------------------------------");
  await run(browser, "cdp");

  await browser.close();
  server.close();
})();

async function cdpInterception(page) {
  const cdp = await page.target().createCDPSession();
  await cdp.send("Network.setRequestInterception", {
    patterns: [{ urlPattern: "*" }]
  });
  await cdp.on(
    "Network.requestIntercepted",
    async ({ interceptionId, request }) => {
      // see that the implementation actually works
      if (request.url === "https://jsonplaceholder.typicode.com/todos/1") {
        await cdp.send("Network.continueInterceptedRequest", {
          interceptionId,
          url: "https://jsonplaceholder.typicode.com/todos/2"
        });
      } else {
        await cdp.send("Network.continueInterceptedRequest", {
          interceptionId
        });
      }
    }
  );
}
