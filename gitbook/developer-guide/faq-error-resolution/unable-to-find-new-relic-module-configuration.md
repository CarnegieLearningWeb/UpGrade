# Unable to find New Relic module configuration

## Problem

Unable to find New Relic module configuration:\
\
\[nodemon] starting \`node --inspect=0.0.0.0:9200 -r ts-node/register ./src/app.ts\`

```
[nodemon] starting `node --inspect=0.0.0.0:9200 -r ts-node/register ./src/app.ts`
Debugger listening on ws://0.0.0.0:9200/cd2fd09e-74f1-4120-b67c-d13b4af54e07
For help, see: https://nodejs.org/en/docs/inspector
Unable to find New Relic module configuration. A base configuration file
can be copied from /Users/zlee/Desktop/code/educational-experiment-service/packages/Upgrade/node_modules/newrelic/newrelic.js
and put at /Users/zlee/Desktop/code/educational-experiment-service/packages/Upgrade/newrelic.js or
/Users/zlee/Desktop/code/educational-experiment-service/packages/Upgrade/src/newrelic.js.
If you are not using file-based configuration, please set the environment
variable `NEW_RELIC_NO_CONFIG_FILE=true`.
Unable to find New Relic module configuration. A base configuration file
can be copied from /Users/zlee/Desktop/code/educational-experiment-service/packages/Upgrade/node_modules/newrelic/newrelic.js
and put at /Users/zlee/Desktop/code/educational-experiment-service/packages/Upgrade/newrelic.js or
/Users/zlee/Desktop/code/educational-experiment-service/packages/Upgrade/src/newrelic.js.
If you are not using file-based configuration, please set the environment
variable `NEW_RELIC_NO_CONFIG_FILE=true`.
{"v":0,"level":30,"name":"newrelic_bootstrap","hostname":"13366-zlee","pid":71702,"time":"2021-09-10T01:54:35.894Z","msg":"Using New Relic for Node.js. Agent version: 7.1.0; Node version: v14.17.6."}
{"v":0,"level":30,"name":"newrelic_bootstrap","hostname":"13366-zlee","pid":71702,"time":"2021-09-10T01:54:35.898Z","msg":"Module not enabled in configuration; not starting."}
[nodemon] clean exit - waiting for changes before restart


```

## Solution

You don't need a newrelic configuration for development purposes. Comment out `import 'newrelic/index';` in app.ts and run `npm run dev`
