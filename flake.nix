{
  description = "rust-sa - Local Git Diff Reviewer (Tauri + Rust + TanStack Start)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    rust-overlay.url = "github:oxalica/rust-overlay";
    rust-overlay.inputs.nixpkgs.follows = "nixpkgs";
    devo.url = "github:conao3/rust-devo";
    devo.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [
        "x86_64-linux"
        "aarch64-darwin"
      ];

      imports = [
        inputs.treefmt-nix.flakeModule
      ];

      perSystem =
        { system, ... }:
        let
          overlay =
            final: prev:
            let
              nodejs = prev.nodejs_24;
              pnpm = prev.pnpm_10.override { inherit nodejs; };
            in
            {
              inherit
                nodejs
                pnpm
                ;
            };

          pkgs = import inputs.nixpkgs {
            inherit system;
            overlays = [
              inputs.rust-overlay.overlays.default
              overlay
            ];
          };

          rustToolchain = pkgs.rust-bin.stable.latest.default.override {
            extensions = [
              "rust-src"
              "rust-analyzer"
              "clippy"
            ];
          };

          tauriBuildInputs =
            with pkgs;
            lib.optionals stdenv.isLinux [
              webkitgtk_4_1
              gtk3
              gdk-pixbuf
              glib
              librsvg
              libayatana-appindicator
              libappindicator-gtk3
              pkg-config
              openssl
              dbus
              libsoup_3
            ]
            ++ lib.optionals stdenv.isDarwin [ ];

          devo = inputs.devo.packages.${system}.default;

          branchSlug = pkgs.writeShellScript "branch-slug" ''
            set -euo pipefail -o posix
            BRANCH=$(${pkgs.git}/bin/git rev-parse --abbrev-ref HEAD)
            if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ] || [ "$BRANCH" = "develop" ]; then
              echo "main"
            else
              echo "$BRANCH" | sed 's/[^a-zA-Z0-9]/-/g' | tr '[:upper:]' '[:lower:]'
            fi
          '';
        in
        {
          treefmt = {
            projectRootFile = "flake.nix";
            programs.rustfmt.enable = true;
            programs.prettier.enable = true;
            programs.nixfmt.enable = true;
          };

          apps = {
            dev = {
              type = "app";
              program = toString (
                pkgs.writeShellScript "dev-start" ''
                  set -euo pipefail -o posix

                  export PROJECT_ROOT="$PWD"
                  export SLUG=$(${branchSlug})
                  export FLAKE_REF="path:${toString ./.}"
                  export RUST_LOG="''${RUST_LOG:-info}"

                  exec ${devo}/bin/devo run --attach -f ./devo.yaml
                ''
              );
            };

            dev-stop = {
              type = "app";
              program = toString (
                pkgs.writeShellScript "dev-stop" ''
                  set -euo pipefail -o posix

                  export PROJECT_ROOT="$PWD"
                  export FLAKE_REF="path:${toString ./.}"

                  ${devo}/bin/devo stop -f ./devo.yaml || true
                ''
              );
            };
          };

          devShells.default = pkgs.mkShell {
            packages = with pkgs; [
              rustToolchain
              nodejs
              pnpm
              cargo-tauri
              tmux
            ]
            ++ tauriBuildInputs;

            shellHook = ''
              export RUST_LOG=info
              export TAURI_DEV_HOST=127.0.0.1
            '';
          };
        };
    };
}
