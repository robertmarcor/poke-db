import React from "react";

type Props = {};

function Footer({}: Props) {
  return (
    <div className="grid gap-1 text-center mt-5 p-2">
      <p>
        Developed and maintained by{" "}
        <a
          href="https://github.com/robertmarcor"
          className="underline hover:no-underline text-(--accent)"
        >
          Robert
        </a>
      </p>
      <p>
        Resource for data{" "}
        <a
          href="https://pokeapi.co/"
          className="underline hover:no-underline text-(--accent)"
        >
          PokèAPI
        </a>
      </p>
      <p>
        Resource for data PokèAPI Official sprites belong to © Nintendo/Creatures
        Inc./GAME FREAK Inc.
      </p>
    </div>
  );
}

export default Footer;
