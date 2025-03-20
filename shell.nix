with import <nixpkgs> { };

mkShell {
  buildInputs = [
    python313
    (python313.pkgs.uv)
  ];

  shellHook = ''
    echo "Python $(python --version) environment with uv $(uv --version) activated!"
  '';
}
