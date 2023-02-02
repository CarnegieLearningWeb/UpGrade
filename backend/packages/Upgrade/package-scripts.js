// eslint-disable-next-line @typescript-eslint/no-var-requires
const { series, rimraf } = require('nps-utils');

module.exports = {
  scripts: {
    default: 'nps',
    help: 'npm start help',
    test: {
      default: 'nps test.coverage',
      integration: {
        default: {
          script: series('nps banner.testIntegration', 'nps test.integration.run'),
          description: 'Runs the integration tests',
        },
        run: {
          default: {
            // -i. Run all tests serially in the current process, rather than creating a worker pool of child processes that run tests. This can be useful for debugging.
            script: 'cross-env NODE_ENV=test jest --runInBand --testPathPattern=integration -i',
            hiddenFromHelp: true,
          },
          watch: {
            script: 'cross-env NODE_ENV=test jest --runInBand --watch --testPathPattern=integration -i',
            hiddenFromHelp: true,
          },
        },
      },
      unit: {
        default: {
          script: series('nps banner.testUnit', 'nps test.unit.run'),
          description: 'Runs the integration tests',
        },
        run: {
          default: {
            // -i. Run all tests serially in the current process, rather than creating a worker pool of child processes that run tests. This can be useful for debugging.
            script: 'cross-env NODE_ENV=test jest --runInBand --testPathPattern=unit -i',
            hiddenFromHelp: true,
          },
          watch: {
            script: 'cross-env NODE_ENV=test jest --runInBand --watch --testPathPattern=unit -i',
            hiddenFromHelp: true,
          },
          coverage: {
            script: 'cross-env NODE_ENV=test jest --runInBand --testPathPattern=unit -i --coverage',
            hiddenFromHelp: true,
          },
        },
      },
      verbose: {
        script: 'nps test.verbose',
        hiddenFromHelp: true,
      },
      coverage: {
        script: 'cross-env NODE_ENV=test jest --coverage',
        hiddenFromHelp: true,
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
        script:
          'cross-env NODE_ENV=production ts-node --project tsconfig.build.json -r tsconfig-paths/register dist/src/app.js',
      },
      development: {
        script: 'cross-env NODE_ENV=development node dist/src/app.js',
      },
      description: 'Serves the current app and watches for changes to restart it',
    },
    /**
     * Creates the dockerrun configuration files
     */
    dockerConfig: {
      default: {
        script: series(`nps dockerConfig.development`),
        hiddenFromHelp: true,
      },
      development: {
        script: series(runFast('./commands/dockerrun.ts development')),
        hiddenFromHelp: true,
      },
      production: {
        script: series(runFast('./commands/dockerrun.ts production')),
        hiddenFromHelp: true,
      },
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
      script: series(
        'nps banner.build',
        'nps config',
        'nps typecheck.build',
        'nps clean.dist',
        'nps transpile',
        'nps copy'
      ),
      description: 'Builds the app into the dist directory',
    },
    /**
     * Database scripts
     */
    db: {
      seed: {
        script: series(
          'nps banner.seed',
          'nps db.drop',
          'nps config',
          runFast('./node_modules/typeorm-seeding/dist/cli.js seed')
        ),
        description: 'Seeds generated records into the database',
      },
      drop: {
        script: runFast('./node_modules/typeorm/cli.js schema:drop'),
        description: 'Drops the schema of the database',
      },
    },

    typecheck: {
      default: {
        script: 'tsc --noEmit',
        description: 'Typecheck the project without emitting the output',
      },
      build: {
        script: 'tsc --noEmit --project ./tsconfig.build.json',
        description: 'Typecheck the project without emitting the output',
      },
    },

    /**
     * Runs ESLint over your project
     */
    // lint: {
    //   eslint: {
    //     // script: eslint('./src'),
    //     hiddenFromHelp: true,
    //   },
    //   prettier: {
    //     // script: prettier(),
    //     hiddenFromHelp: true,
    //   },
    // },
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
  options: {
    silent: true,
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

// function eslint(path) {
//   let command = `eslint -c ../../../.eslintrc.js --ext .ts ${path}`;
//   console.log('Running eslint and prettier on dir:', command);
//   return command;
// }

// function prettier() {
//   const command = `prettier --config ../../../.prettierrc './{src, test}/**/*.ts' --write`;
//   console.log('Running prettier on dir:', command);
//   return command;
// }
