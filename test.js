const puppeteer = require("puppeteer");
const devices = require("puppeteer/DeviceDescriptors");

async function run() {
  const browser = await puppeteer.launch({
    headless: false
  });

  const page = await browser.newPage();
  await page.goto(
    "https://app-test.swisspost.ch/OnlinePayment/web/v1/boe/test",
    { waitUntil: "networkidle0" }
  );

  await page.waitForSelector(".onlinePaymentSpinnerContainer", {
    visible: true
  });

  const element = await getElement(".onlinePaymentSpinnerContainer");

  async function getElement(selector) {
    let value = await page.evaluate(sel => {
      return document.querySelector(sel);
    }, selector);
    return value;
  }

  let input = await page.$(".onlinePaymentSpinnerContainer");
  let valueHandle = await input.getProperty("style");

  debugger;
}

run();
