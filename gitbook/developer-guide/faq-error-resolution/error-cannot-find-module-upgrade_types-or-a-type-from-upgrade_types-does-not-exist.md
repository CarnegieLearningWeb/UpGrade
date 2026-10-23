# Error: Cannot find module 'upgrade\_types' (or a type from 'upgrade\_types' does not exist)

## Problem

```
Error: Cannot find module 'upgrade_types'
```

...or if import of a type from `upgrade_types` cannot be resolved

## Solution

This build error may occur in several different places, especially if switching branches or pulling latest from current branch.\
\
`upgrade_types` is a [separate module](https://github.com/CarnegieLearningWeb/UpGrade/tree/main/types) at the root of the monorepo that contains shared enums and interfaces used by multiple other modules within the monorepo. Sometimes this may get out of sync in local machine.\
\
If running local docker setup, try running `make setup` to reinstall and copy the types folder into the backend directory.\
\
If that's a no go, you can do it manually or run:\
\
`cd /types`\
`npm install`\
`cd ../backend`\
`cp -R ../types packages/Upgrade`
