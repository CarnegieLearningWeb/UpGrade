let
    bootstrapPkgs = import <nixpkgs> {};

    # nixos-22.11 ~ 2023-06-29
    pinnedPkgs = bootstrapPkgs.pkgs.fetchFromGitHub {
        owner = "NixOS";
        repo = "nixpkgs";
        rev = "1732ee9120e43c1df33a33004315741d0173d0b2";
        sha256 = "sha256-BWXwhyT6a5b+SxnFhB8ktQGwnuDTq2RcKd3oD8SyimU=";
    };

    nixpkgs = import pinnedPkgs {};
in 
with nixpkgs;
stdenv.mkDerivation {
    name = "upgrade-shell";
    buildInputs = 
        # packages everyone gets
        [ bash nodejs-18_x python38 cacert ]
        ++ lib.optional stdenv.isDarwin
        [ darwin.apple_sdk.frameworks.CoreServices ];
}
