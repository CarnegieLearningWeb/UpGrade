var envVars = require("./settings.env.js");
replace = require("replace-in-file");

var replacements = [];
var envKeys = Object.keys(envVars);

for (var i in envKeys) {
  var replacement = {};
  replacement["search"] = new RegExp("%" + envKeys[i] + "%", "g");
  replacement["replace"] = envVars[envKeys[i]];

  replacements.push(replacement);
}

console.log(
  "Beginning pre build environment string replacements in environments.*.ts files"
);
for (var i in replacements) {
  try {
    const changedFiles = replace.sync({
      files: [
        '/projects/upgrade/src/environments/environment.prod.ts',
        '/projects/upgrade/src/environments/environment.qa.ts',
        '/projects/upgrade/src/environments/environment.staging.ts',
      ],
      from: replacements[i].search,
      to: replacements[i].replace,
      allowEmptyPaths: false,
    });
  } catch (error) {
    console.error("Error occurred:", error);
  }
}
console.log("Pre build environment string replacements complete.");