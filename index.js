const puppeteer = require("puppeteer");
const devices = require("puppeteer/DeviceDescriptors");
const writeReport = require("./report.js").writeReport;
const createReportConfig = require("./config.js").createReportConfig;
const useCases = require("./usecases.js");

const doHeadless = true;
const report = createReportConfig();

async function runAll() {
  async function runit(report, useCaseConfig) {
    const browser = await puppeteer.launch({
      headless: doHeadless
    });
    const page = await browser.newPage();

    const result = await useCaseConfig.run(page, report, useCaseConfig);
    browser.close();
    return result;
  }

  const cases = [useCases.masterCard, useCases.postFinanceCard, useCases.esr];
  //const cases = [useCases.esr];
  await Promise.all(
    cases.map(c => {
      return runit(report, c)
        .then(result => {
          report[c.name] = result;
        })
        .catch(error => {
          report[c.name] = { error: { ...error, message: error.message } };
          return Promise.resolve();
        });
    })
  );
  writeReport(report);
}

runAll();
