const puppeteer = require('puppeteer');
const express = require('express');

async function run(browser, intercept) {
  const page = await browser.newPage();

  if (intercept) {
    await page.setRequestInterception(true);
    await page.on('request', request => request.continue())
  }

  await page.exposeFunction('__log__', value => console.log(value))
  await page.goto('http://localhost:5000/')
  await new Promise(r => setTimeout(r, 2000))

  await page.close()
}

function serve() {
  const app = express();
  app.use(express.static(__dirname));
  return app.listen(5000);
}

(async () => {
  const server = serve();
  const browser = await puppeteer.launch()

  console.log("The following works:")
  console.log("--------------------")
  await run(browser, false)

  console.log("But the following doesn't:")
  console.log("--------------------------")
  await run(browser, true)

  await browser.close();
  server.close();
})();
