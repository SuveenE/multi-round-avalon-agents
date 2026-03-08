"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Game, Mission, TournamentMemories, Reflection } from "@/types/game";
import PlayerCard from "./PlayerCard";

interface GameViewerProps {
  game: Game;
  memories?: TournamentMemories | null;
  gameIndex?: number;
}

type Phase =
  | "overview"
  | "discussion"
  | "proposal"
  | "voting"
  | "execution"
  | "assassin";

export default function GameViewer({
  game,
  memories,
  gameIndex,
}: GameViewerProps) {
  const searchParams = useSearchParams();
  const [currentMission, setCurrentMission] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<Phase>("overview");
  const [currentProposal, setCurrentProposal] = useState(0);
  const [showMemories, setShowMemories] = useState(false);
  const [selectedMemoryPlayer, setSelectedMemoryPlayer] = useState<
    string | null
  >(null);

  const hasMemories = memories && gameIndex !== undefined && gameIndex > 0;

  const getPlayerReflections = (playerName: string): Reflection[] => {
    if (!memories || gameIndex === undefined) return [];
    const playerMem = memories.player_memories[playerName];
    if (!playerMem) return [];
    return playerMem.reflections.filter((r) => r.game_number <= gameIndex);
  };

  const getPlayerRoleInGame = (
    playerName: string,
    gameNumber: number,
  ): string | null => {
    if (!memories) return null;
    const playerMem = memories.player_memories[playerName];
    if (!playerMem) return null;
    const ref = playerMem.reflections.find((r) => r.game_number === gameNumber);
    return ref?.role_played ?? null;
  };

  const mission = game.missions[currentMission];
  const proposal = mission?.proposals[currentProposal];

  const autoPlayHref = `?tournament=${searchParams.get("tournament") ?? 0}&game=${searchParams.get("game") ?? 0}&autoplay=true`;

  // Build a map of player name -> loyal servant index for unique images
  const loyalServantIndexMap = useMemo(() => {
    const map: Record<string, number> = {};
    let idx = 0;
    game.players.forEach((p) => {
      if (p.role === "good") {
        map[p.name] = idx++;
      }
    });
    return map;
  }, [game.players]);

  const getMissionStatus = (m: Mission) => {
    if (m.mission_result === "success") return "bg-blue-500 text-white";
    if (m.mission_result === "fail") return "bg-red-500 text-white";
    return "bg-gray-200 text-gray-600";
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 font-display">
              {game.game_id}
            </h1>
            <p className="text-xs text-gray-500">
              {game.players.length} players · {game.config.reasoning_effort}{" "}
              reasoning
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasMemories && (
              <button
                onClick={() => {
                  setShowMemories(true);
                  const firstPlayer = game.players[0]?.name || null;
                  setSelectedMemoryPlayer(firstPlayer);
                }}
                className="px-4 py-1.5 rounded-full text-sm font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors flex items-center gap-2 font-display"
                title="View player memories from previous games"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                Memories
              </button>
            )}
            <Link
              href={autoPlayHref}
              target="_blank"
              className="px-4 py-1.5 rounded-full text-sm font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors flex items-center gap-2 font-display"
              title="Auto Play with narration"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Auto Play
            </Link>
            <div
              className={`px-3 py-1 rounded text-sm font-medium ${
                game.winner === "good"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {game.winner} wins
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="flex gap-1.5 flex-wrap">
          {game.players.map((player) => (
            <PlayerCard
              key={player.name}
              player={player}
              size="sm"
              loyalServantIndex={loyalServantIndexMap[player.name]}
            />
          ))}
        </div>
      </div>

      {/* Mission & Phase Selector */}
      <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase font-medium">
            Mission
          </span>
          <div className="flex gap-1">
            {game.missions.map((m, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentMission(idx);
                  setCurrentPhase("discussion");
                  setCurrentProposal(0);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${getMissionStatus(m)} ${
                  currentMission === idx
                    ? "ring-2 ring-offset-1 ring-gray-400"
                    : ""
                }`}
              >
                {idx + 1}
              </button>
            ))}
            {game.assassin_phase && (
              <button
                onClick={() => setCurrentPhase("assassin")}
                className={`px-3 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-purple-500 text-white ${
                  currentPhase === "assassin"
                    ? "ring-2 ring-offset-1 ring-gray-400"
                    : ""
                }`}
              >
                ⚔
              </button>
            )}
          </div>
        </div>

        {currentPhase !== "assassin" && mission && (
          <div className="flex gap-1">
            {["discussion", "proposal", "voting", "execution"].map((phase) => (
              <button
                key={phase}
                onClick={() => setCurrentPhase(phase as Phase)}
                className={`px-3 py-1 rounded text-xs capitalize transition-colors ${
                  currentPhase === phase
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {phase}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentPhase === "overview" && (
          <div className="text-center text-gray-400 py-8 text-sm">
            Select a mission to view gameplay
          </div>
        )}

        {currentPhase === "discussion" && mission && (
          <div className="space-y-3 max-w-2xl">
            {mission.discussion.map((msg, idx) => {
              const player = game.players.find((p) => p.name === msg.player);
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-l-2 ${
                    player?.is_good
                      ? "bg-blue-50 border-blue-400"
                      : "bg-red-50 border-red-400"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900">
                      {msg.player}
                    </span>
                    <span className="text-xs text-gray-500">
                      {player?.role}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{msg.content}</p>
                </div>
              );
            })}
          </div>
        )}

        {currentPhase === "proposal" && mission && (
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              {mission.proposals.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentProposal(idx)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    currentProposal === idx
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            {proposal && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-2">
                  Leader:{" "}
                  <span className="font-medium text-gray-700">
                    {proposal.leader}
                  </span>
                </div>
                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-1">Team</div>
                  <div className="flex gap-1">
                    {proposal.team_members.map((name) => {
                      const player = game.players.find((p) => p.name === name);
                      return player ? (
                        <PlayerCard
                          key={name}
                          player={player}
                          size="sm"
                          loyalServantIndex={loyalServantIndexMap[name]}
                        />
                      ) : null;
                    })}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {proposal.reasoning}
                </p>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    proposal.vote_result === "approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {proposal.vote_result}
                </span>
              </div>
            )}
          </div>
        )}

        {currentPhase === "voting" && mission && proposal && (
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              {mission.proposals.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentProposal(idx)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    currentProposal === idx
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            {proposal.votes.length === 0 ? (
              <p className="text-sm text-gray-500">
                5th proposal - auto-approved
              </p>
            ) : (
              <div className="space-y-2">
                {proposal.votes.map((vote, idx) => {
                  const player = game.players.find(
                    (p) => p.name === vote.player,
                  );
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border-l-2 ${
                        vote.vote === "approve"
                          ? "bg-green-50 border-green-400"
                          : "bg-red-50 border-red-400"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900">
                            {vote.player}
                          </span>
                          <span className="text-xs text-gray-500">
                            {player?.role}
                          </span>
                        </div>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            vote.vote === "approve"
                              ? "bg-green-200 text-green-800"
                              : "bg-red-200 text-red-800"
                          }`}
                        >
                          {vote.vote}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{vote.comment}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {currentPhase === "execution" && mission && (
          <div className="space-y-4 max-w-2xl">
            <div
              className={`p-6 rounded-lg text-center ${
                mission.mission_result === "success"
                  ? "bg-blue-50"
                  : "bg-red-50"
              }`}
            >
              <div
                className={`text-2xl font-bold ${
                  mission.mission_result === "success"
                    ? "text-blue-600"
                    : "text-red-600"
                }`}
              >
                {mission.mission_result?.toUpperCase()}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {mission.fail_count} fail card(s)
              </div>
            </div>
            {mission.quest_actions && (
              <div className="space-y-1">
                {mission.quest_actions.map((action, idx) => {
                  const player = game.players.find(
                    (p) => p.name === action.player,
                  );
                  return (
                    <div
                      key={idx}
                      className={`p-2 rounded flex items-center justify-between ${
                        action.action === "success" ? "bg-blue-50" : "bg-red-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {action.player}
                        </span>
                        <span className="text-xs text-gray-500">
                          {player?.role}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          action.action === "success"
                            ? "bg-blue-200 text-blue-800"
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {action.action}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {currentPhase === "assassin" && game.assassin_phase && (
          <div className="space-y-4 max-w-2xl">
            <div className="text-xs text-gray-500 uppercase font-medium">
              Evil Team Discussion
            </div>
            <div className="space-y-2">
              {game.assassin_phase.evil_discussion.map((msg, idx) => {
                const player = game.players.find((p) => p.name === msg.player);
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-red-50 border-l-2 border-red-400"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900">
                        {msg.player}
                      </span>
                      <span className="text-xs text-gray-500">
                        {player?.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{msg.content}</p>
                  </div>
                );
              })}
            </div>
            <div className="p-4 rounded-lg bg-purple-50">
              <div className="text-xs text-gray-500 uppercase font-medium mb-2">
                Assassin&apos;s Guess
              </div>
              <div className="text-sm space-y-1 mb-3">
                <p>
                  <span className="text-gray-500">Assassin:</span>{" "}
                  <span className="font-semibold text-gray-900">
                    {game.assassin_phase.assassin}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Target:</span>{" "}
                  <span className="font-semibold text-gray-900">
                    {game.assassin_phase.guess}
                  </span>
                </p>
                <p className="text-gray-600">{game.assassin_phase.reasoning}</p>
              </div>
              <span
                className={`px-3 py-1 rounded text-sm font-medium ${
                  game.assassin_phase.correct
                    ? "bg-red-200 text-red-800"
                    : "bg-blue-200 text-blue-800"
                }`}
              >
                {game.assassin_phase.correct
                  ? "Correct - Evil Wins"
                  : "Wrong - Good Wins"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Memories Modal */}
      {showMemories && hasMemories && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowMemories(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 font-display">
                  Player Memories
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Reflections going into Game {(gameIndex ?? 0) + 1} (from games
                  1&ndash;{gameIndex})
                </p>
              </div>
              <button
                onClick={() => setShowMemories(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Player Tabs */}
            <div className="px-5 pt-3 border-b border-gray-200 flex gap-1 flex-wrap flex-shrink-0">
              {game.players.map((player) => (
                <button
                  key={player.name}
                  onClick={() => setSelectedMemoryPlayer(player.name)}
                  className={`px-3 py-1.5 rounded-t text-sm font-medium transition-colors ${
                    selectedMemoryPlayer === player.name
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {player.name}
                </button>
              ))}
            </div>

            {/* Reflections Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {selectedMemoryPlayer && (
                <>
                  {getPlayerReflections(selectedMemoryPlayer).length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">
                      No memories available for this player.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {getPlayerReflections(selectedMemoryPlayer).map(
                        (reflection) => (
                          <div
                            key={reflection.game_number}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-semibold text-gray-900 font-display">
                                Game {reflection.game_number}
                              </span>
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                  reflection.role_played === "good" ||
                                  reflection.role_played === "merlin"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {reflection.role_played}
                              </span>
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                  reflection.game_result === "won"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {reflection.game_result}
                              </span>
                            </div>

                            <div className="mb-3">
                              <div className="text-xs text-gray-500 uppercase font-medium mb-1">
                                Self Assessment
                              </div>
                              <p className="text-sm text-gray-700">
                                {reflection.self_assessment}
                              </p>
                            </div>

                            {Object.keys(reflection.player_observations)
                              .length > 0 && (
                              <div>
                                <div className="text-xs text-gray-500 uppercase font-medium mb-1">
                                  Observations
                                </div>
                                <div className="space-y-1.5">
                                  {Object.entries(
                                    reflection.player_observations,
                                  ).map(([name, observation]) => {
                                    const obsRole = getPlayerRoleInGame(
                                      name,
                                      reflection.game_number,
                                    );
                                    return (
                                      <div
                                        key={name}
                                        className="bg-gray-50 rounded p-2"
                                      >
                                        <span className="text-sm font-medium text-gray-900">
                                          {name}
                                        </span>
                                        {obsRole && (
                                          <span
                                            className={`ml-1.5 text-xs px-1.5 py-0.5 rounded font-medium ${
                                              obsRole === "good" ||
                                              obsRole === "merlin" ||
                                              obsRole === "percival"
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-red-100 text-red-700"
                                            }`}
                                          >
                                            {obsRole}
                                          </span>
                                        )}
                                        <span className="text-sm font-medium text-gray-900">
                                          :
                                        </span>{" "}
                                        <span className="text-sm text-gray-600">
                                          {observation}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
