var envVars = require("./settings.env.js");
replace = require("replace-in-file");

var replacements = [];
var envKeys = Object.keys(envVars);
var environment = process.env.ENV || 'develop';
for (var i in envKeys) {
  var replacement = {};
  replacement["search"] = new RegExp("%" + envKeys[i] + "%", "g");
  replacement["replace"] = envVars[envKeys[i]];

  replacements.push(replacement);
}

console.log(
  `Beginning pre build environment string replacements in environments.${environment}.ts files`
);
for (var i in replacements) {
  try {
    const changedFiles = replace.sync({
      files: [
        `projects/upgrade/src/environments/environment.${environment}.ts`,
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