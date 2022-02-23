let
    bootstrapPkgs = import <nixpkgs> {};

    # nixos-21.11 ~ 2021-11-30
    pinnedPkgs = bootstrapPkgs.pkgs.fetchFromGitHub {
        owner = "NixOS";
        repo = "nixpkgs";
        rev = "a7ecde854aee5c4c7cd6177f54a99d2c1ff28a31";
        sha256 = "162dywda2dvfj1248afxc45kcrg83appjd0nmdb541hl7rnncf02";
    };

    nixpkgs = import pinnedPkgs {};
in 
with nixpkgs;
stdenv.mkDerivation {
    name = "upgrade-shell";
    buildInputs = 
        # packages everyone gets
        [ bash nodejs-12_x python38 cacert ]
        ++ lib.optional stdenv.isDarwin
        [ darwin.apple_sdk.frameworks.CoreServices ];
}
