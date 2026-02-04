"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getBasePath } from "@/lib/config";

interface Character {
  name: string;
  team: "good" | "evil";
  image: string;
  ability: string;
  description: string;
}

const characters: Character[] = [
  // Good Team
  {
    name: "Merlin",
    team: "good",
    image: "/assets/merlin.png",
    ability: "Knows Evil",
    description:
      "Merlin knows the identity of all evil players (except Mordred). Must guide the good team subtly without revealing themselves, as the Assassin will try to identify and kill Merlin if good wins three missions.",
  },
  {
    name: "Percival",
    team: "good",
    image: "/assets/percival.png",
    ability: "Knows Merlin",
    description:
      "Percival knows who Merlin is, allowing them to help protect Merlin's identity. However, Morgana also appears as Merlin to Percival, so they must figure out who the real Merlin is.",
  },
  {
    name: "Loyal Servant",
    team: "good",
    image: "/assets/loyal-servant-1.png",
    ability: "None",
    description:
      "Loyal Servants of Arthur have no special knowledge. They must rely on discussion, voting patterns, and their intuition to identify evil players and complete missions successfully.",
  },
  // Evil Team
  {
    name: "Assassin",
    team: "evil",
    image: "/assets/assassin.png",
    ability: "Kill Merlin",
    description:
      "The Assassin knows the other evil players and works to fail missions. If good completes three missions, the Assassin gets one chance to identify and kill Merlin. If successful, evil wins instead.",
  },
  {
    name: "Morgana",
    team: "evil",
    image: "/assets/morgana.png",
    ability: "Appears as Merlin",
    description:
      "Morgana knows the other evil players and appears as Merlin to Percival. This creates confusion and makes it harder for Percival to protect the real Merlin.",
  },
  {
    name: "Mordred",
    team: "evil",
    image: "/assets/mordred.png",
    ability: "Hidden from Merlin",
    description:
      "Mordred is hidden from Merlin's knowledge, making them extremely dangerous. They know the other evil players but Merlin cannot identify them as evil.",
  },
  {
    name: "Oberon",
    team: "evil",
    image: "/assets/oberon.png",
    ability: "Unknown to Evil",
    description:
      "Oberon doesn't know who the other evil players are, and they don't know Oberon is evil. This isolation makes coordination difficult but also makes Oberon harder to identify.",
  },
  {
    name: "Minion of Mordred",
    team: "evil",
    image: "/assets/minion.png",
    ability: "Knows Evil",
    description:
      "A generic evil role that knows the identity of other evil players (except Oberon). Works to sabotage missions and sow discord among the good team.",
  },
];

export default function PlayersPage() {
  const basePath = getBasePath();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  const goodCharacters = characters.filter((c) => c.team === "good");
  const evilCharacters = characters.filter((c) => c.team === "evil");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Character Guide</h1>
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Back
          </Link>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Good Team */}
        <div className="mb-12">
          <div className="text-center mb-6">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Good Team</span>
          </div>
          <div className="flex gap-8">
            {goodCharacters.map((character) => (
              <button
                key={character.name}
                onClick={() => setSelectedCharacter(character)}
                className="group relative transition-transform duration-200 hover:scale-105"
              >
                <div className="w-36 h-36 md:w-44 md:h-44 relative rounded-full overflow-hidden border-4 border-blue-200 group-hover:border-blue-400 transition-colors shadow-lg">
                  <Image
                    src={basePath + character.image}
                    alt={character.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="mt-3 text-sm font-semibold text-gray-700 text-center">
                  {character.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Evil Team */}
        <div>
          <div className="text-center mb-6">
            <span className="text-sm font-semibold text-red-600 uppercase tracking-wide">Evil Team</span>
          </div>
          <div className="flex gap-6 flex-wrap justify-center">
            {evilCharacters.map((character) => (
              <button
                key={character.name}
                onClick={() => setSelectedCharacter(character)}
                className="group relative transition-transform duration-200 hover:scale-105"
              >
                <div className="w-32 h-32 md:w-40 md:h-40 relative rounded-full overflow-hidden border-4 border-red-200 group-hover:border-red-400 transition-colors shadow-lg">
                  <Image
                    src={basePath + character.image}
                    alt={character.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="mt-3 text-sm font-semibold text-gray-700 text-center">
                  {character.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-400 mt-10">Click a character to see their abilities</p>
      </div>

      {/* Modal Overlay */}
      {selectedCharacter && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCharacter(null)}
        >
          <div
            className={`bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl transform transition-all ${
              selectedCharacter.team === "good" ? "border-4 border-blue-300" : "border-4 border-red-300"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-40 h-40 relative rounded-full overflow-hidden border-4 shadow-xl mb-6 ${
                selectedCharacter.team === "good" ? "border-blue-300" : "border-red-300"
              }`}>
                <Image
                  src={basePath + selectedCharacter.image}
                  alt={selectedCharacter.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedCharacter.name}</h3>
              <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-6 ${
                selectedCharacter.team === "good"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-red-100 text-red-700"
              }`}>
                {selectedCharacter.ability}
              </span>
              <p className="text-gray-600 leading-relaxed mb-6">
                {selectedCharacter.description}
              </p>
              <button
                onClick={() => setSelectedCharacter(null)}
                className="px-6 py-2 rounded-full bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
