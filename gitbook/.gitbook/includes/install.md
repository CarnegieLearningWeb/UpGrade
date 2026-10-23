---
title: Install
---

## Install UpGrade

Get the code from https://github.com/CarnegieLearningWeb/UpGrade (monorepo contains all packages):

```sh
# https
git clone https://github.com/CarnegieLearningWeb/UpGrade.git

# ssh
git clone git@github.com:CarnegieLearningWeb/UpGrade.git
```

By default you'll be checked out to the "dev" branch, which is the latest code, but unstable and meant for developers. For most users, switch to "main" for the latest stable build, "dev" is not going to be guaranteed to work.

```bash
git checkout main
```

\
Nav into root of project and run these commands to install dependencies.

```sh
npm ci

cd ./types
npm ci
npm run build
# copy this folder into the backend as well, the build will want it there
cp -R . ../backend/packages/Upgrade

cd ../backend
npm ci

cd ./packages/Upgrade
npm ci

cd ../../../frontend
npm ci
```
