#!/usr/bin/env bash

set -e;
set -u;

localsetup() {
    rm -rf package-lock.json node_modules
    npm install

    cd types
    rm -rf package-lock.json node_modules
    npm install

    cd ../backend
    rm -rf package-lock.json node_modules
    npm install

    cp -R ../types packages/Upgrade
    cd packages/Upgrade
    rm -rf package-lock.json node_modules
    npm install

    cd ../../../frontend
    rm -rf package-lock.json node_modules
    npm install
}

mirrorsetup() {
    cd backend
    npm ci

    cp -R ../types packages/Upgrade
    cd packages/Upgrade
    cp .env.docker.local .env
    npm ci

    cd ../../../frontend
    npm ci
}

help() {
    cat <<EOF
Usage:
    -h: this help guide
    -l: run setup for local development environment
    -m: run setup for mirroring qa/prod environment
EOF
    exit 0;
}

while getopts hlm opt
do
    case "$opt" in
        h) help;;
	    l) localsetup;;
        m) mirrorsetup;;
    esac
done