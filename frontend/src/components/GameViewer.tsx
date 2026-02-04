"use client";

import { useState, useMemo } from "react";
import { Game, Mission } from "@/types/game";
import PlayerCard from "./PlayerCard";

interface GameViewerProps {
  game: Game;
}

type Phase = "overview" | "discussion" | "proposal" | "voting" | "execution" | "assassin";

export default function GameViewer({ game }: GameViewerProps) {
  const [currentMission, setCurrentMission] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<Phase>("overview");
  const [currentProposal, setCurrentProposal] = useState(0);

  const mission = game.missions[currentMission];
  const proposal = mission?.proposals[currentProposal];

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
            <h1 className="text-lg font-semibold text-gray-900">{game.game_id}</h1>
            <p className="text-xs text-gray-500">
              {game.players.length} players · {game.config.reasoning_effort} reasoning
            </p>
          </div>
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
          <span className="text-xs text-gray-500 uppercase font-medium">Mission</span>
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
                  currentMission === idx ? "ring-2 ring-offset-1 ring-gray-400" : ""
                }`}
              >
                {idx + 1}
              </button>
            ))}
            {game.assassin_phase && (
              <button
                onClick={() => setCurrentPhase("assassin")}
                className={`px-3 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-purple-500 text-white ${
                  currentPhase === "assassin" ? "ring-2 ring-offset-1 ring-gray-400" : ""
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
                    <span className="font-semibold text-sm text-gray-900">{msg.player}</span>
                    <span className="text-xs text-gray-500">{player?.role}</span>
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
                  Leader: <span className="font-medium text-gray-700">{proposal.leader}</span>
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
                <p className="text-sm text-gray-600 mb-3">{proposal.reasoning}</p>
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
              <p className="text-sm text-gray-500">5th proposal - auto-approved</p>
            ) : (
              <div className="space-y-2">
                {proposal.votes.map((vote, idx) => {
                  const player = game.players.find((p) => p.name === vote.player);
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
                          <span className="font-semibold text-sm text-gray-900">{vote.player}</span>
                          <span className="text-xs text-gray-500">{player?.role}</span>
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
                mission.mission_result === "success" ? "bg-blue-50" : "bg-red-50"
              }`}
            >
              <div className={`text-2xl font-bold ${
                mission.mission_result === "success" ? "text-blue-600" : "text-red-600"
              }`}>
                {mission.mission_result?.toUpperCase()}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {mission.fail_count} fail card(s)
              </div>
            </div>
            {mission.quest_actions && (
              <div className="space-y-1">
                {mission.quest_actions.map((action, idx) => {
                  const player = game.players.find((p) => p.name === action.player);
                  return (
                    <div
                      key={idx}
                      className={`p-2 rounded flex items-center justify-between ${
                        action.action === "success" ? "bg-blue-50" : "bg-red-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{action.player}</span>
                        <span className="text-xs text-gray-500">{player?.role}</span>
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
            <div className="text-xs text-gray-500 uppercase font-medium">Evil Team Discussion</div>
            <div className="space-y-2">
              {game.assassin_phase.evil_discussion.map((msg, idx) => {
                const player = game.players.find((p) => p.name === msg.player);
                return (
                  <div key={idx} className="p-3 rounded-lg bg-red-50 border-l-2 border-red-400">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900">{msg.player}</span>
                      <span className="text-xs text-gray-500">{player?.role}</span>
                    </div>
                    <p className="text-sm text-gray-700">{msg.content}</p>
                  </div>
                );
              })}
            </div>
            <div className="p-4 rounded-lg bg-purple-50">
              <div className="text-xs text-gray-500 uppercase font-medium mb-2">Assassin&apos;s Guess</div>
              <div className="text-sm space-y-1 mb-3">
                <p><span className="text-gray-500">Assassin:</span> <span className="font-semibold text-gray-900">{game.assassin_phase.assassin}</span></p>
                <p><span className="text-gray-500">Target:</span> <span className="font-semibold text-gray-900">{game.assassin_phase.guess}</span></p>
                <p className="text-gray-600">{game.assassin_phase.reasoning}</p>
              </div>
              <span
                className={`px-3 py-1 rounded text-sm font-medium ${
                  game.assassin_phase.correct
                    ? "bg-red-200 text-red-800"
                    : "bg-blue-200 text-blue-800"
                }`}
              >
                {game.assassin_phase.correct ? "Correct - Evil Wins" : "Wrong - Good Wins"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
