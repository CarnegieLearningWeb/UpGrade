const { series, rimraf } = require('nps-utils');

module.exports = {
  scripts: {
    default: 'nps',
    help: 'npm start help',
    test: {
      default: 'nps test.integration',
      integration: {
        default: {
          script: series('nps banner.testIntegration', 'nps test.integration.pretest', 'nps test.integration.run'),
          description: 'Runs the integration tests',
        },
        pretest: {
          script: tslint(`./test/integration/**.ts`),
          hiddenFromHelp: true,
        },
        run: {
          default: {
            // -i. Run all tests serially in the current process, rather than creating a worker pool of child processes that run tests. This can be useful for debugging.
            script: 'cross-env NODE_ENV=test jest --testPathPattern=integration -i',
            hiddenFromHelp: true,
          },
          watch: {
            script: 'cross-env NODE_ENV=test jest --watch --testPathPattern=integration -i',
            hiddenFromHelp: true,
          },
        },
        verbose: {
          script: 'nps "test --verbose"',
          hiddenFromHelp: true,
        },
        coverage: {
          script: 'nps "test --coverage"',
          hiddenFromHelp: true,
        },
      },
      watch: {
        script: series('nps banner.testIntegration', 'nps test.integration.pretest', 'nps test.integration.run.watch'),
        description: 'Runs the integration tests',
      },
    },
    /**
     * Serves the current app and watches for changes to restart it
     */
    serve: {
      default: {
        script: series('nps banner.serve', 'nodemon'),
        hiddenFromHelp: true,
      },
      inspector: {
        script: series('nps banner.serve', 'nodemon --inspect'),
        description: 'Serves the current app and watches for changes to restart it, you may attach inspector to it.',
      },
      production: {
        script: 'cross-env NODE_ENV=production node dist/src/app.js',
      },
      description: 'Serves the current app and watches for changes to restart it',
    },
    /**
     * Creates the needed configuration files
     */
    config: {
      script: series(runFast('./commands/tsconfig.ts')),
      hiddenFromHelp: true,
    },
    /**
     * Copies static files to the build folder
     */
    copy: {
      default: {
        script: series(`nps copy.public`),
        hiddenFromHelp: true,
      },
      public: {
        script: copy('./src/public/*', './dist/src'),
        hiddenFromHelp: true,
      },
      tmp: {
        script: copyDir('./.tmp/src', './dist'),
        hiddenFromHelp: true,
      },
    },

    /**
     * Builds the app into the dist directory
     */
    build: {
      script: series('nps banner.build', 'nps config', 'nps lint', 'nps clean.dist', 'nps transpile', 'nps copy'),
      description: 'Builds the app into the dist directory',
    },
    /**
     * Runs TSLint over your project
     */
    lint: {
      script: tslint(`./src/**/*.ts`),
      hiddenFromHelp: true,
    },
    /**
     * Transpile your app into javascript
     */
    transpile: {
      script: `cross-env NODE_ENV=production tsc --project ./tsconfig.build.json`,
      hiddenFromHelp: true,
    },
    /**
     * Clean files and folders
     */
    clean: {
      default: {
        script: series(`nps banner.clean`, `nps clean.dist`),
        description: 'Deletes the ./dist folder',
      },
      dist: {
        script: rimraf('./dist'),
        hiddenFromHelp: true,
      },
      tmp: {
        script: rimraf('./.tmp'),
        hiddenFromHelp: true,
      },
    },
    /**
     * This creates pretty banner to the terminal
     */
    banner: {
      build: banner('build'),
      serve: banner('serve'),
      testUnit: banner('test.unit'),
      testIntegration: banner('test.integration'),
      testE2E: banner('test.e2e'),
      migrate: banner('migrate'),
      seed: banner('seed'),
      reverst: banner('revert'),
      clean: banner('clean'),
    },
  },
};

function copy(source, target) {
  return `copyfiles --up 1 ${source} ${target}`;
}

function copyDir(source, target) {
  return `ncp ${source} ${target}`;
}

function banner(name) {
  return {
    hiddenFromHelp: true,
    silent: true,
    description: `Shows ${name} banners to the console`,
    script: runFast(`./commands/banner.ts ${name}`),
  };
}

function runFast(path) {
  return `ts-node --transpile-only ${path}`;
}

function tslint(path) {
  return `tslint ${path} -c ./tslint.json --format stylish`;
}
