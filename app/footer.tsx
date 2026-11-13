import React from "react";

type Props = {};

function Footer({}: Props) {
  return (
    <div className="bg-slate-900 grid text-center gap-2 py-4">
      <p>Developed and maintained by Robert</p>
      <p>Resource for data PokèAPI Official sprites</p>
      <p>
        Resource for data PokèAPI Official sprites belong to © Nintendo/Creatures
        Inc./GAME FREAK Inc.
      </p>
    </div>
  );
}

export default Footer;
