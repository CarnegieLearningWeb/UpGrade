#!/bin/bash

cd backend
rm -f package-lock.json
npm install

cp -R ../types packages/Upgrade
cd packages/Upgrade
cp .env.docker.local .env
rm -f package-lock.json
npm install

cd ../../../frontend
rm -f package-lock.json
npm install

cd ..