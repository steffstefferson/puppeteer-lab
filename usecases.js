async function playMasterCard(page, report, useCase) {
  const onlinePaymentSiteHandler = await startUp(report, page, useCase);

  page.click("#ButtonPaymentMethod_Master");
  await page.waitForSelector("#Button_Pay");
  await delay(report.siteDelay);

  await onlinePaymentSiteHandler.screenshot("CreditCardForm");
  await fillInput(page, {
    cardNumberInput: "5105 1051 0510 5100",
    CVC: "123",
    expiry_date: "12/19"
  });
  await onlinePaymentSiteHandler.screenshot("CreditCardFormFilled");
  const bezahlenButton = "#Button_Pay";
  await page.click(bezahlenButton);

  // todo how to detect waiting spinner?
  //   const watchDog = page.waitForFunction(
  //     "document.querySelector('.onlinePaymentSpinner').style['border-top'] != null"
  //   );
  //   await watchDog;
  //   await screenshot("waitingspinner");

  const result = await onlinePaymentSiteHandler.waitAndHandleSimulatorSuccessPage();
  return result;
}

async function playEsr(page, report, useCase) {
  const onlinePaymentSiteHandler = await startUp(report, page, useCase);

  await page.click(useCase.waitForElementOnFirstPage);
  await delay(report.siteDelay);

  const buttonEsr = await page.$("#ButtonQuickPay_ESR");
  if (!buttonEsr) {
    throw "ESR not available!";
  }
  await onlinePaymentSiteHandler.screenshot("Available Payment methods");
  await page.click("#ButtonQuickPay_ESR");

  const result = await onlinePaymentSiteHandler.waitAndHandleSimulatorSuccessPage();
  return result;
}

async function playPostfinanceCard(page, report, useCase) {
  const onlinePaymentSiteHandler = await startUp(report, page, useCase);

  await page.click("#ButtonPaymentMethod_PostFinanceCard");

  //iframe of postfinance
  await delay(report.siteDelay);
  const frames = await page.frames();
  const iFrame = frames.find(f => f.name() === "iFrameRedirectPaymentProvider");

  await iFrame.waitForSelector('input[name="Debit Direct_paymeth"]');
  //wait for site is completely loaded
  await delay(report.siteDelay);
  //click image PostFinanceCard

  const framedButton = await iFrame.$('input[name="Debit Direct_paymeth"]');
  await framedButton.click();
  await delay(report.siteDelay);

  // click Zahlung beantragt.
  const zahlungBeantragtButton = await iFrame.$("#btn_Accept");
  await onlinePaymentSiteHandler.screenshot("PostFinanceCardMaskCofirmPayment");
  await zahlungBeantragtButton.click();

  const result = await onlinePaymentSiteHandler.waitAndHandleSimulatorSuccessPage();
  return result;
}

async function waitAndHandleSimulatorSuccessPage(
  page,
  screenshot,
  errorHandling
) {
  await delay(40 * 1000);
  await screenshot("PaymentResult");
  const errorCode = getErrorCode(page.url());
  const javascriptErrors = errorHandling.getErrorLog();
  return { errorCode, javascriptErrors };
}

async function fillInput(page, inputs) {
  for (var key in inputs) {
    // skip loop if the property is from prototype
    if (!inputs.hasOwnProperty(key)) continue;
    await page.type("#" + key, inputs[key]);
  }
}

function getErrorCode(url) {
  if (url.indexOf("ErrorCode") == -1) {
    return 0;
  }
  const errorCodeKeyValue = url
    .substring(url.indexOf("ErrorCode"))
    .substring("&");
  return errorCodeKeyValue.replace("ErrorCode=", "");
}

async function startUp(report, page, useCase) {
  const screenshotsTaken = [];

  const screenshotFn = makeScreenshot(page, report.guid + "-" + useCase.name);

  const screenshot = async function(name) {
    const takenScreenshot = await screenshotFn(name);
    screenshotsTaken.push(takenScreenshot);
  };

  const url = fillParams(report.url, useCase.urlParams);

  await page.goto(url, { waitUntil: "networkidle0" });
  await page.waitForSelector(useCase.waitForElementOnFirstPage);
  console.log("Initial page loaded");
  await screenshot("InitialPage");
  const version = await getVersionOfSite(page);

  const errorHandling = initErrorHandling(page);

  const waitAndHandleSimulatorSuccess = async function() {
    const result = await waitAndHandleSimulatorSuccessPage(
      page,
      screenshot,
      errorHandling
    );
    return {
      version,
      screenshotsTaken,
      ...result
    };
  };

  return {
    errorHandling,
    screenshot,
    waitAndHandleSimulatorSuccessPage: waitAndHandleSimulatorSuccess
  };
}

function fillParams(url, params) {
  let filledUrl = url;
  for (var key in params) {
    // skip loop if the property is from prototype
    if (!params.hasOwnProperty(key)) continue;
    filledUrl = filledUrl.replace("#" + key + "#", params[key]);
  }
  return filledUrl;
}

async function getVersionOfSite(page) {
  const content = await page.content();
  // looking for <!-- AssemblyVersion: 4.0.0.411 -->
  const matches = content.match(/AssemblyVersion: (\d+.\d+.\d+.\d+)/);
  if (!matches) {
    return "Unknown AssemblyVersion";
  }
  console.log("found assemblyVersion " + matches[1]);
  return matches[1];
}

function makeScreenshot(page, guid) {
  let counter = 0;
  return async function(screenshotName) {
    counter++;
    const counterPadded = (counter + "").padStart(3, "0000");
    const name =
      "screenshots/" +
      guid +
      "_" +
      counterPadded +
      "_" +
      screenshotName +
      ".png";
    console.log("make screenshot with name: " + name);
    await page.screenshot({
      path: name,
      fullPage: true
    });
    return name;
  };
}

function initErrorHandling(pageToHandle) {
  const errors = { onErrorLog: [], onPageErrorLog: [] };

  pageToHandle.on("pageerror", function(err) {
    errors.onPageErrorLog.push(err.toString());
  });

  pageToHandle.on("error", function(err) {
    errors.onErrorLog.push(err.toString());
  });

  function getErrorLog() {
    return errors;
  }
  return { getErrorLog };
}

function delay(timeout) {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  });
}

module.exports = {
  masterCard: {
    name: "MasterCard",
    waitForElementOnFirstPage: ".availableCards",
    run: playMasterCard,
    urlParams: {
      target: "BOE+GUI+Redesign+INT",
      uc: "UC01_BOE_DE_Standard"
    }
  },
  postFinanceCard: {
    name: "PostFinanceCard",
    waitForElementOnFirstPage: ".availableCards",
    run: playPostfinanceCard,
    urlParams: {
      target: "BOE+GUI+Redesign+INT",
      uc: "UC01_BOE_DE_Standard"
    }
  },
  esr: {
    name: "ESR",
    waitForElementOnFirstPage: "#PayRemainingAmountButton",
    run: playEsr,
    urlParams: {
      target: "BOI+GUI+Redesign+INT",
      uc: "UC02_BOI_DE_Standard"
    }
  }
};
