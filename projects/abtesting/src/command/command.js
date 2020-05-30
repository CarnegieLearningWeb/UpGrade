const async = require('async');
const npm = require('npm');

npm.load({}, err => {
  if (err) {
    return;
  }

  async.series([
    (callback) => {
      npm.run('cl:bundle', `dist/${process.argv[2]}`, (error) => {
        callback(error, null);
      })
    },
    (callback) => {
      npm.run('cl:create-package-json', `dist/${process.argv[2]}/package.json`, (error) => {
        callback(error, null);
      })
    }
  ]);
});
