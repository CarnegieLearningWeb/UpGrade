#! /usr/bin/env nix-shell
#! nix-shell -p bash nodejs-12_x python38 cacert darwin.apple_sdk.frameworks.CoreServices -i bash --pure
#! nix-shell -I nixpkgs=https://github.com/NixOS/nixpkgs/archive/a7ecde854aee5c4c7cd6177f54a99d2c1ff28a31.tar.gz

# above channel commit hash is nixos-21.11 ~ 2021-11-30

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
    npm ci

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