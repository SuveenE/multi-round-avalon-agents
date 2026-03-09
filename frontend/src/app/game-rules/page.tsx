"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getBasePath } from "@/lib/config";

interface Role {
  name: string;
  team: "good" | "evil";
  image: string;
  count?: number;
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
      {
        name: "Loyal Servant",
        team: "good",
        image: "/assets/loyal-servant-1.png",
      },
      { name: "Assassin", team: "evil", image: "/assets/assassin.png" },
      { name: "Morgana", team: "evil", image: "/assets/morgana.png" },
    ],
    missionSizes: [2, 3, 2, 3, 3],
    knowledge: [
      {
        from: "Merlin",
        sees: "Assassin, Morgana",
        note: "Sees all evil players",
      },
      {
        from: "Percival",
        sees: "Merlin, Morgana",
        note: "Sees both but doesn't know which is which",
      },
      { from: "Loyal Servant", sees: "Nobody", note: "No special knowledge" },
      { from: "Assassin", sees: "Morgana", note: "Knows fellow evil" },
      {
        from: "Morgana",
        sees: "Assassin",
        note: "Knows fellow evil; appears as Merlin to Percival",
      },
    ],
  },
  {
    playerCount: 6,
    roles: [
      { name: "Merlin", team: "good", image: "/assets/merlin.png" },
      { name: "Percival", team: "good", image: "/assets/percival.png" },
      {
        name: "Loyal Servant",
        team: "good",
        image: "/assets/loyal-servant-1.png",
        count: 2,
      },
      { name: "Assassin", team: "evil", image: "/assets/assassin.png" },
      { name: "Morgana", team: "evil", image: "/assets/morgana.png" },
    ],
    missionSizes: [2, 3, 4, 3, 4],
    knowledge: [
      {
        from: "Merlin",
        sees: "Assassin, Morgana",
        note: "Sees all evil players",
      },
      {
        from: "Percival",
        sees: "Merlin, Morgana",
        note: "Sees both but doesn't know which is which",
      },
      { from: "Loyal Servant", sees: "Nobody", note: "No special knowledge" },
      { from: "Assassin", sees: "Morgana", note: "Knows fellow evil" },
      {
        from: "Morgana",
        sees: "Assassin",
        note: "Knows fellow evil; appears as Merlin to Percival",
      },
    ],
  },
  {
    playerCount: 7,
    roles: [
      { name: "Merlin", team: "good", image: "/assets/merlin.png" },
      { name: "Percival", team: "good", image: "/assets/percival.png" },
      {
        name: "Loyal Servant",
        team: "good",
        image: "/assets/loyal-servant-1.png",
        count: 2,
      },
      { name: "Mordred", team: "evil", image: "/assets/mordred.png" },
      { name: "Morgana", team: "evil", image: "/assets/morgana.png" },
      { name: "Oberon", team: "evil", image: "/assets/oberon.png" },
    ],
    missionSizes: [2, 3, 3, 4, 4],
    knowledge: [
      {
        from: "Merlin",
        sees: "Morgana, Oberon",
        note: "Sees all evil except Mordred",
      },
      {
        from: "Percival",
        sees: "Merlin, Morgana",
        note: "Sees both but doesn't know which is which",
      },
      { from: "Loyal Servant", sees: "Nobody", note: "No special knowledge" },
      {
        from: "Mordred",
        sees: "Morgana",
        note: "Hidden from Merlin; knows fellow evil (not Oberon)",
      },
      {
        from: "Morgana",
        sees: "Mordred",
        note: "Knows fellow evil (not Oberon); appears as Merlin to Percival",
      },
      {
        from: "Oberon",
        sees: "Nobody",
        note: "Unknown to other evil players; doesn't know evil team",
      },
    ],
  },
  {
    playerCount: 8,
    roles: [
      { name: "Merlin", team: "good", image: "/assets/merlin.png" },
      { name: "Percival", team: "good", image: "/assets/percival.png" },
      {
        name: "Loyal Servant",
        team: "good",
        image: "/assets/loyal-servant-1.png",
        count: 3,
      },
      { name: "Assassin", team: "evil", image: "/assets/assassin.png" },
      { name: "Morgana", team: "evil", image: "/assets/morgana.png" },
      { name: "Mordred", team: "evil", image: "/assets/mordred.png" },
    ],
    missionSizes: [3, 4, 4, 5, 5],
    knowledge: [
      {
        from: "Merlin",
        sees: "Assassin, Morgana",
        note: "Sees all evil except Mordred",
      },
      {
        from: "Percival",
        sees: "Merlin, Morgana",
        note: "Sees both but doesn't know which is which",
      },
      { from: "Loyal Servant", sees: "Nobody", note: "No special knowledge" },
      { from: "Assassin", sees: "Morgana, Mordred", note: "Knows fellow evil" },
      {
        from: "Morgana",
        sees: "Assassin, Mordred",
        note: "Knows fellow evil; appears as Merlin to Percival",
      },
      {
        from: "Mordred",
        sees: "Assassin, Morgana",
        note: "Hidden from Merlin; knows fellow evil",
      },
    ],
  },
  {
    playerCount: 9,
    roles: [
      { name: "Merlin", team: "good", image: "/assets/merlin.png" },
      { name: "Percival", team: "good", image: "/assets/percival.png" },
      {
        name: "Loyal Servant",
        team: "good",
        image: "/assets/loyal-servant-1.png",
        count: 4,
      },
      { name: "Assassin", team: "evil", image: "/assets/assassin.png" },
      { name: "Morgana", team: "evil", image: "/assets/morgana.png" },
      { name: "Mordred", team: "evil", image: "/assets/mordred.png" },
    ],
    missionSizes: [3, 4, 4, 5, 5],
    knowledge: [
      {
        from: "Merlin",
        sees: "Assassin, Morgana",
        note: "Sees all evil except Mordred",
      },
      {
        from: "Percival",
        sees: "Merlin, Morgana",
        note: "Sees both but doesn't know which is which",
      },
      { from: "Loyal Servant", sees: "Nobody", note: "No special knowledge" },
      { from: "Assassin", sees: "Morgana, Mordred", note: "Knows fellow evil" },
      {
        from: "Morgana",
        sees: "Assassin, Mordred",
        note: "Knows fellow evil; appears as Merlin to Percival",
      },
      {
        from: "Mordred",
        sees: "Assassin, Morgana",
        note: "Hidden from Merlin; knows fellow evil",
      },
    ],
  },
  {
    playerCount: 10,
    roles: [
      { name: "Merlin", team: "good", image: "/assets/merlin.png" },
      { name: "Percival", team: "good", image: "/assets/percival.png" },
      {
        name: "Loyal Servant",
        team: "good",
        image: "/assets/loyal-servant-1.png",
        count: 4,
      },
      { name: "Assassin", team: "evil", image: "/assets/assassin.png" },
      { name: "Morgana", team: "evil", image: "/assets/morgana.png" },
      { name: "Mordred", team: "evil", image: "/assets/mordred.png" },
      { name: "Oberon", team: "evil", image: "/assets/oberon.png" },
    ],
    missionSizes: [3, 4, 4, 5, 5],
    knowledge: [
      {
        from: "Merlin",
        sees: "Assassin, Morgana, Oberon",
        note: "Sees all evil except Mordred",
      },
      {
        from: "Percival",
        sees: "Merlin, Morgana",
        note: "Sees both but doesn't know which is which",
      },
      { from: "Loyal Servant", sees: "Nobody", note: "No special knowledge" },
      {
        from: "Assassin",
        sees: "Morgana, Mordred",
        note: "Knows fellow evil (not Oberon)",
      },
      {
        from: "Morgana",
        sees: "Assassin, Mordred",
        note: "Knows fellow evil (not Oberon); appears as Merlin to Percival",
      },
      {
        from: "Mordred",
        sees: "Assassin, Morgana",
        note: "Hidden from Merlin; knows fellow evil (not Oberon)",
      },
      {
        from: "Oberon",
        sees: "Nobody",
        note: "Unknown to other evil players; doesn't know evil team",
      },
    ],
  },
];

function RoleCard({ role, basePath }: { role: Role; basePath: string }) {
  const borderColor =
    role.team === "good" ? "border-blue-300" : "border-red-300";
  const bgColor = role.team === "good" ? "bg-blue-50" : "bg-red-50";

  return (
    <div
      className={`flex flex-col items-center gap-2 p-4 rounded-xl ${bgColor}`}
    >
      <div className="relative">
        <div
          className={`w-20 h-20 relative rounded-full overflow-hidden border-3 ${borderColor} shadow-md`}
        >
          <Image
            src={basePath + role.image}
            alt={role.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        {role.count && role.count > 1 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gray-700 text-white text-xs font-bold flex items-center justify-center shadow">
            {role.count}
          </span>
        )}
      </div>
      <span className="text-sm font-semibold text-gray-800 font-display">
        {role.name}
      </span>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          role.team === "good"
            ? "bg-blue-100 text-blue-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {role.team === "good" ? "Good" : "Evil"}
      </span>
    </div>
  );
}

function KnowledgeChart({
  composition,
  basePath,
}: {
  composition: Composition;
  basePath: string;
}) {
  const { roles, knowledge } = composition;
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  // Build a lookup: from -> set of names they see
  const seesMap = new Map<string, Set<string>>();
  for (const k of knowledge) {
    const names = k.sees === "Nobody" ? [] : k.sees.split(", ");
    seesMap.set(k.from, new Set(names));
  }

  // Layout: place roles in a circle
  const cx = 350;
  const cy = 320;
  const radius = 230;
  const nodeRadius = 48;
  // Start from top (-90deg) and go clockwise
  const angleOffset = -Math.PI / 2;

  const positions = roles.map((_, i) => {
    const angle = angleOffset + (2 * Math.PI * i) / roles.length;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });

  // Build edges
  const edges: { fromIdx: number; toIdx: number; mutual: boolean }[] = [];
  const edgeSet = new Set<string>();

  roles.forEach((fromRole, fromIdx) => {
    const sees = seesMap.get(fromRole.name) || new Set();
    roles.forEach((toRole, toIdx) => {
      if (fromIdx === toIdx || !sees.has(toRole.name)) return;
      const key = [Math.min(fromIdx, toIdx), Math.max(fromIdx, toIdx)].join(
        "-",
      );
      if (edgeSet.has(key)) {
        // Mark as mutual
        const existing = edges.find(
          (e) =>
            (e.fromIdx === toIdx && e.toIdx === fromIdx) ||
            (e.fromIdx === fromIdx && e.toIdx === toIdx),
        );
        if (existing) existing.mutual = true;
        return;
      }
      edgeSet.add(key);
      edges.push({ fromIdx, toIdx, mutual: false });
    });
  });

  // Compute arrow path with offset from node edge
  function getArrowPoints(
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / dist;
    const uy = dy / dist;
    const startOffset = nodeRadius + 4;
    const endOffset = nodeRadius + 4;
    return {
      x1: from.x + ux * startOffset,
      y1: from.y + uy * startOffset,
      x2: to.x - ux * endOffset,
      y2: to.y - uy * endOffset,
    };
  }

  // Color for edges based on the "from" role
  function edgeColor(fromIdx: number) {
    return roles[fromIdx].team === "good" ? "#3b82f6" : "#ef4444";
  }

  const isHighlighting = hoveredRole !== null;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 700, height: 660 }}>
        <svg width={700} height={660} className="absolute inset-0">
          <defs>
            {edges.map((edge, i) => {
              const isRelevant =
                hoveredRole === roles[edge.fromIdx].name ||
                hoveredRole === roles[edge.toIdx].name;
              const markerOpacity = isHighlighting
                ? isRelevant
                  ? 1
                  : 0.1
                : 0.7;
              const color = edge.mutual ? "#8b5cf6" : edgeColor(edge.fromIdx);
              return (
                <g key={`markers-${i}`}>
                  <marker
                    id={`arrowhead-${i}`}
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill={color}
                      opacity={markerOpacity}
                    />
                  </marker>
                  {edge.mutual && (
                    <marker
                      id={`arrowhead-rev-${i}`}
                      markerWidth="10"
                      markerHeight="7"
                      refX="1"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="10 0, 0 3.5, 10 7"
                        fill={color}
                        opacity={markerOpacity}
                      />
                    </marker>
                  )}
                </g>
              );
            })}
          </defs>

          {/* Edges */}
          {edges.map((edge, i) => {
            const from = positions[edge.fromIdx];
            const to = positions[edge.toIdx];
            const { x1, y1, x2, y2 } = getArrowPoints(from, to);
            const isRelevant =
              hoveredRole === roles[edge.fromIdx].name ||
              hoveredRole === roles[edge.toIdx].name;
            const opacity = isHighlighting ? (isRelevant ? 1 : 0.08) : 0.6;
            const strokeWidth = isHighlighting && isRelevant ? 3 : 2;

            if (edge.mutual) {
              // Draw double-headed line with arrows on both ends
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#8b5cf6"
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  markerEnd={`url(#arrowhead-${i})`}
                  markerStart={`url(#arrowhead-rev-${i})`}
                />
              );
            } else {
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={edgeColor(edge.fromIdx)}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  markerEnd={`url(#arrowhead-${i})`}
                />
              );
            }
          })}
        </svg>

        {/* Role nodes as HTML on top of SVG */}
        {roles.map((role, i) => {
          const pos = positions[i];
          const isHovered = hoveredRole === role.name;
          // Check if this role is connected to the hovered role (either direction)
          const isConnected =
            isHighlighting &&
            !isHovered &&
            hoveredRole !== null &&
            (seesMap.get(hoveredRole)?.has(role.name) ||
              seesMap.get(role.name)?.has(hoveredRole));
          const isDimmed = isHighlighting && !isHovered && !isConnected;
          const borderColor =
            role.team === "good" ? "border-blue-400" : "border-red-400";
          const ringColor =
            role.team === "good" ? "ring-blue-300" : "ring-red-300";

          return (
            <div
              key={role.name}
              className="absolute flex flex-col items-center"
              style={{
                left: pos.x - nodeRadius,
                top: pos.y - nodeRadius,
                width: nodeRadius * 2,
              }}
              onMouseEnter={() => setHoveredRole(role.name)}
              onMouseLeave={() => setHoveredRole(null)}
            >
              <div
                className={`relative rounded-full overflow-hidden border-3 ${borderColor} shadow-lg cursor-pointer transition-all duration-200 ${
                  isHovered ? `ring-4 ${ringColor} scale-110` : ""
                } ${isConnected ? `ring-2 ${ringColor} scale-105 opacity-90` : ""} ${isDimmed ? "opacity-20" : ""}`}
                style={{ width: nodeRadius * 2, height: nodeRadius * 2 }}
              >
                <Image
                  src={basePath + role.image}
                  alt={role.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <span
                className={`mt-1 text-xs font-semibold text-gray-700 font-display whitespace-nowrap transition-all duration-200 ${
                  isConnected ? "opacity-90" : ""
                } ${isDimmed ? "opacity-20" : ""}`}
              >
                {role.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-6 mt-2 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-blue-500 rounded" />
          <span>Good sees</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-red-500 rounded" />
          <span>Evil sees</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-purple-500 rounded" />
          <span>Mutual</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Hover over a role to highlight their connections
      </p>
    </div>
  );
}

export default function GameRulesPage() {
  const basePath = getBasePath();
  const [selectedCount, setSelectedCount] = useState(5);
  const composition = compositions.find(
    (c) => c.playerCount === selectedCount,
  )!;

  const goodRoles = composition.roles.filter((r) => r.team === "good");
  const evilRoles = composition.roles.filter((r) => r.team === "evil");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 font-display">
            Game Rules
          </h1>
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

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* Game flow diagram */}
        <section className="mb-12">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5 font-display">
            How a Game Works
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex justify-center">
            <Image
              src={basePath + "/assets/gameflow.png"}
              alt="Game flow diagram showing the phases of an Avalon game"
              width={900}
              height={400}
              className="w-full max-w-4xl h-auto"
              unoptimized
            />
          </div>
        </section>

        {/* Player count selector */}
        <div className="flex justify-center gap-2 mb-10">
          {compositions.map((c) => (
            <button
              key={c.playerCount}
              onClick={() => setSelectedCount(c.playerCount)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                selectedCount === c.playerCount
                  ? "bg-gray-900 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              {c.playerCount}P
            </button>
          ))}
        </div>

        {/* Player count heading */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 font-display">
            {selectedCount}-Player Game
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {goodRoles.reduce((sum, r) => sum + (r.count || 1), 0)} Good vs{" "}
            {evilRoles.reduce((sum, r) => sum + (r.count || 1), 0)} Evil
          </p>
        </div>

        {/* Composition */}
        <section className="mb-12">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5 font-display">
            Composition
          </h3>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-sm font-semibold text-blue-600 mb-3 font-display">
                Good Team
              </div>
              <div className="flex gap-3 flex-wrap">
                {goodRoles.map((role) => (
                  <RoleCard key={role.name} role={role} basePath={basePath} />
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-red-600 mb-3 font-display">
                Evil Team
              </div>
              <div className="flex gap-3 flex-wrap">
                {evilRoles.map((role) => (
                  <RoleCard key={role.name} role={role} basePath={basePath} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Knowledge chart */}
        <section className="mb-12">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5 font-display">
            Who Knows Who
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <KnowledgeChart composition={composition} basePath={basePath} />
          </div>
        </section>

        {/* Mission sizes */}
        <section className="mb-12">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5 font-display">
            Mission Team Sizes
          </h3>
          <div className="flex gap-3">
            {composition.missionSizes.map((size, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1 bg-white rounded-xl border border-gray-200 px-5 py-3 shadow-sm"
              >
                <span className="text-xs text-gray-400 font-medium">
                  Mission {i + 1}
                </span>
                <span className="text-xl font-bold text-gray-800">{size}</span>
                <span className="text-xs text-gray-400">players</span>
              </div>
            ))}
          </div>
        </section>

        {/* Knowledge details */}
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5 font-display">
            Knowledge Details
          </h3>
          <div className="space-y-3">
            {composition.knowledge.map((k) => {
              const role = composition.roles.find((r) => r.name === k.from)!;
              return (
                <div
                  key={k.from}
                  className="flex items-start gap-4 bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                >
                  <div
                    className={`w-10 h-10 relative rounded-full overflow-hidden border-2 flex-shrink-0 ${
                      role.team === "good"
                        ? "border-blue-200"
                        : "border-red-200"
                    }`}
                  >
                    <Image
                      src={basePath + role.image}
                      alt={role.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-800 font-display">
                      {k.from}
                    </span>
                    <span className="text-sm text-gray-400 mx-2">sees</span>
                    <span className="text-sm font-medium text-gray-700">
                      {k.sees}
                    </span>
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
