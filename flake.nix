{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = { self, nixpkgs }: 
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
      inherit (pkgs) mkShell;
    in {
      devShells.${system}.default = mkShell {
        packages = with pkgs; [ nodejs fish yarn wakeonlan ];

        shellHook = "exec ${pkgs.fish}/bin/fish";
      };
    };
}
