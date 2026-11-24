# nodemon exits without explanation

## Problem

```
[nodemon] starting `node --inspect=0.0.0.0:9200 -r ts-node/register ./src/app.ts`
Debugger listening on ws://0.0.0.0:9200/2b5addb5-00d6-4975-b657-da113994f6a9
For help, see: https://nodejs.org/en/docs/inspector
[nodemon] clean exit - waiting for changes before restart
```

## Solution

Ensure you are running proper version on Node locally (16.22.0+)
