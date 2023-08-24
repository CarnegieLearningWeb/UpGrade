#! /usr/bin/env nix-shell
#! nix-shell docker.nix --pure -i bash

# to execute this script, you only need to install nix-shell:
# sh <(curl -L https://nixos.org/nix/install)
# (see https://nixos.org/nix/ for more)

set -e;
set -u;

setuplocal() {
    npm ci

    cd types
    npm ci

    cd ../backend
    npm ci

    cp -R ../types packages/Upgrade
    cd packages/Upgrade
    npm ci --legacy-peer-deps

    cd ../../../frontend
    npm ci
}

help() {
    cat <<EOF
Usage:
    -h: this help guide
    -l: run setup for local development environment
EOF
    exit 0;
}

while getopts hl opt
do
    case "$opt" in
        h) help;;
        l) setuplocal;;
    esac
done