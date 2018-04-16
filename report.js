const fs = require("fs");

function writeReport(report) {
  const data = JSON.stringify(report, null, 2);
  const fileName = "screenshots/" + report.guid + ".json";
  fs.writeFile(fileName, data, "utf8", function(success, error) {
    console.log("writing file", fileName);
  });
}

module.exports = { writeReport };
