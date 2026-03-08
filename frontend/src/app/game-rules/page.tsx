"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getBasePath } from "@/lib/config";

interface Role {
  name: string;
  team: "good" | "evil";
  image: string;
}

interface KnowledgeEntry {
  from: string;
  sees: string;
  note: string;
}

interface Composition {
  playerCount: number;
  roles: Role[];
  missionSizes: number[];
  knowledge: KnowledgeEntry[];
}

const compositions: Composition[] = [
  {
    playerCount: 5,
    roles: [
      { name: "Merlin", team: "good", image: "/assets/merlin.png" },
      { name: "Percival", team: "good", image: "/assets/percival.png" },
      { name: "Loyal Servant", team: "good", image: "/assets/loyal-servant-1.png" },
      { name: "Assassin", team: "evil", image: "/assets/assassin.png" },
      { name: "Morgana", team: "evil", image: "/assets/morgana.png" },
    ],
    missionSizes: [2, 3, 2, 3, 3],
    knowledge: [
      { from: "Merlin", sees: "Assassin, Morgana", note: "Sees all evil players" },
      { from: "Percival", sees: "Merlin, Morgana", note: "Sees both but doesn't know which is which" },
      { from: "Loyal Servant", sees: "Nobody", note: "No special knowledge" },
      { from: "Assassin", sees: "Morgana", note: "Knows fellow evil" },
      { from: "Morgana", sees: "Assassin", note: "Knows fellow evil; appears as Merlin to Percival" },
    ],
  },
];

function RoleCard({ role, basePath }: { role: Role; basePath: string }) {
  const borderColor = role.team === "good" ? "border-blue-300" : "border-red-300";
  const bgColor = role.team === "good" ? "bg-blue-50" : "bg-red-50";

  return (
    <div className={`flex flex-col items-center gap-2 p-4 rounded-xl ${bgColor}`}>
      <div className={`w-20 h-20 relative rounded-full overflow-hidden border-3 ${borderColor} shadow-md`}>
        <Image
          src={basePath + role.image}
          alt={role.name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <span className="text-sm font-semibold text-gray-800 font-display">{role.name}</span>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        role.team === "good" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
      }`}>
        {role.team === "good" ? "Good" : "Evil"}
      </span>
    </div>
  );
}

function KnowledgeMatrix({ composition, basePath }: { composition: Composition; basePath: string }) {
  const { roles, knowledge } = composition;

  // Build a lookup: from -> set of names they see
  const seesMap = new Map<string, Set<string>>();
  for (const k of knowledge) {
    const names = k.sees === "Nobody" ? [] : k.sees.split(", ");
    seesMap.set(k.from, new Set(names));
  }

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="p-3 text-xs text-gray-500 font-medium text-left">Sees &rarr;</th>
            {roles.map((role) => (
              <th key={role.name} className="p-2 text-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 relative rounded-full overflow-hidden border-2 ${
                    role.team === "good" ? "border-blue-200" : "border-red-200"
                  }`}>
                    <Image
                      src={basePath + role.image}
                      alt={role.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600 font-display whitespace-nowrap">
                    {role.name}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roles.map((fromRole) => {
            const sees = seesMap.get(fromRole.name) || new Set();
            return (
              <tr key={fromRole.name} className="border-t border-gray-100">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 relative rounded-full overflow-hidden border-2 ${
                      fromRole.team === "good" ? "border-blue-200" : "border-red-200"
                    }`}>
                      <Image
                        src={basePath + fromRole.image}
                        alt={fromRole.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 font-display whitespace-nowrap">
                      {fromRole.name}
                    </span>
                  </div>
                </td>
                {roles.map((toRole) => {
                  const canSee = sees.has(toRole.name);
                  const isSelf = fromRole.name === toRole.name;
                  return (
                    <td key={toRole.name} className="p-2 text-center">
                      {isSelf ? (
                        <span className="text-gray-300 text-lg">&mdash;</span>
                      ) : canSee ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-50">
                          <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" />
                          </svg>
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function GameRulesPage() {
  const basePath = getBasePath();
  const [selectedCount] = useState(5);
  const composition = compositions.find((c) => c.playerCount === selectedCount)!;

  const goodRoles = composition.roles.filter((r) => r.team === "good");
  const evilRoles = composition.roles.filter((r) => r.team === "evil");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 font-display">Game Rules</h1>
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Back
          </Link>
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* Player count heading */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 font-display">{selectedCount}-Player Game</h2>
          <p className="text-sm text-gray-500 mt-1">
            {goodRoles.length} Good vs {evilRoles.length} Evil
          </p>
        </div>

        {/* Composition */}
        <section className="mb-12">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5 font-display">Composition</h3>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-sm font-semibold text-blue-600 mb-3 font-display">Good Team</div>
              <div className="flex gap-3 flex-wrap">
                {goodRoles.map((role) => (
                  <RoleCard key={role.name} role={role} basePath={basePath} />
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-red-600 mb-3 font-display">Evil Team</div>
              <div className="flex gap-3 flex-wrap">
                {evilRoles.map((role) => (
                  <RoleCard key={role.name} role={role} basePath={basePath} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Mission sizes */}
        <section className="mb-12">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5 font-display">Mission Team Sizes</h3>
          <div className="flex gap-3">
            {composition.missionSizes.map((size, i) => (
              <div key={i} className="flex flex-col items-center gap-1 bg-white rounded-xl border border-gray-200 px-5 py-3 shadow-sm">
                <span className="text-xs text-gray-400 font-medium">Mission {i + 1}</span>
                <span className="text-xl font-bold text-gray-800">{size}</span>
                <span className="text-xs text-gray-400">players</span>
              </div>
            ))}
          </div>
        </section>

        {/* Knowledge matrix */}
        <section className="mb-12">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5 font-display">Who Knows Who</h3>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <KnowledgeMatrix composition={composition} basePath={basePath} />
          </div>
        </section>

        {/* Knowledge details */}
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5 font-display">Knowledge Details</h3>
          <div className="space-y-3">
            {composition.knowledge.map((k) => {
              const role = composition.roles.find((r) => r.name === k.from)!;
              return (
                <div key={k.from} className="flex items-start gap-4 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className={`w-10 h-10 relative rounded-full overflow-hidden border-2 flex-shrink-0 ${
                    role.team === "good" ? "border-blue-200" : "border-red-200"
                  }`}>
                    <Image
                      src={basePath + role.image}
                      alt={role.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-800 font-display">{k.from}</span>
                    <span className="text-sm text-gray-400 mx-2">sees</span>
                    <span className="text-sm font-medium text-gray-700">{k.sees}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{k.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
