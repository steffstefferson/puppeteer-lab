var fs = require('fs'),
  PNG = require('pngjs').PNG,
  pixelmatch = require('pixelmatch');

const imageTypes = ['CardSelection', 'CreditCardForm', 'CreditCardFormFilled', 'PaymentResult'];
const existingFilesVersion = "4.0.0.11";
const newFilesVersion = "4.0.0.37";

const sourceDir = "screenshots";
const targetDir = "compares";

imageTypes.forEach(compareThem);

function compareThem(fileName) {

  const fileName1 = sourceDir + "/" + existingFilesVersion + "_" + fileName + ".png";
  const fileName2 = sourceDir + "/" + newFilesVersion + "_" + fileName + ".png";

  const img1 = fs.createReadStream(fileName1).pipe(new PNG()).on('parsed', doneReading);
  const img2 = fs.createReadStream(fileName2).pipe(new PNG()).on('parsed', doneReading);
  var filesRead = 0;

  function doneReading() {
    if (++filesRead < 2) return;
    var diff = new PNG({ width: img1.width, height: img1.height });

    var amountOffDiffrentPixels = pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, { threshold: 0.1 });

    var prefix = amountOffDiffrentPixels == 0 ? "Same" : 'Diff_'+amountOffDiffrentPixels;

    diff.pack().pipe(fs.createWriteStream(targetDir + '/'+prefix+'_' + fileName + '.png'));
  }

}