{
  description = "Python environment for evogenom-ai";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config = {
            allowUnfree = true;
          };
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            python313
            (python313.pkgs.uv)
            terraform
            awscli2
            deno
            bun
            nodejs_23
            pnpm_9
            postgresql
          ];

          shellHook = ''
            echo "Python $(python --version) environment with uv $(uv --version) activated!"
            set -x AWS_PROFILE evogenom-dev
          '';
        };
      }
    );
}
