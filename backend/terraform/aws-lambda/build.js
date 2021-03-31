const fs = require('fs');
const { join } = require('path');
const { exec } = require('child_process');
const buffer = fs.readFileSync(0);
const bufferArgs = JSON.parse(buffer.toString());

var lambdaZip = bufferArgs['lambda_zip'] || process.env.THUB_LAMBDA_ZIP;

var lambdaPath = bufferArgs['lambda_path'] || process.env.THUB_LAMBDA_PATH;
lambdaPath = join(__dirname, '/', lambdaPath);
if (!lambdaPath.endsWith('/')) {
  lambdaPath += '/';
}

var outputPath = bufferArgs['output_path'] || process.env.THUB_OUTPUT_PATH;
outputPath = join(__dirname, '/', outputPath);
if (!outputPath.endsWith('/')) {
  outputPath += '/';
}

//console.log('COMPILE: STEP #1 - Installing all the dependencies using npm');
execPromise('npm install', { cwd: lambdaPath })
  .then(() => {
    //console.log('COMPILE: STEP #2 - compile to javascript');
    return execPromise('npm run build', { cwd: lambdaPath });
  })
  .then(() => {
    //console.log('COMPILE: STEP #3 - compress bundled javascript into .zip file');
    return execPromise(`rm -rf lib && mkdir lib && cp -a node_modules/ lib/node_modules && cp -a dist/schedule lib/schedule`, {
      cwd: lambdaPath,
    });
  })
  .then(() => {
    // console.log('Zip content inside the lib folder')
    return execPromise(`cd lib && zip -r ${lambdaZip} *`, {
      cwd: lambdaPath,
    });
  })
  .then(() => {
    return execPromise(`cp ${lambdaPath}/lib/${lambdaZip} .`, {
      cwd: outputPath,
    });
  })
  .then(() => {
    console.log(JSON.stringify({ error: '0', output_path: outputPath }));
  })
  .catch((error) => {
    console.log(
      JSON.stringify({
        error: '1',
        error: error.toString(),
        output_path: outputPath,
        lambdaPath: lambdaPath,
        __dirname: __dirname,
      })
    );
  });

function execPromise(command, options) {
  const cwd = options.cwd ? options.cwd : process.cwd();
  //console.log(`Running '${command}' in ${cwd}`);
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      /*if (stderr.length > 0 ) { console.error('Warning: ', stderr); }*/
      return resolve(stdout.trim());
    });
  });
}
