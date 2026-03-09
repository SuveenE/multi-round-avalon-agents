"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Game, Mission, TournamentMemories, Reflection } from "@/types/game";
import PlayerCard from "./PlayerCard";

interface AutoPlayViewerProps {
  game: Game;
  gameNumber?: number;
  memories?: TournamentMemories | null;
  gameIndex?: number;
}

interface GameEvent {
  type: "narrator" | "player";
  speaker: string; // player name or "Narrator"
  text: string;
  phase: string; // e.g. "Mission 1 - Discussion", "Assassin Phase"
  missionIndex?: number;
}

function buildEventSequence(game: Game): GameEvent[] {
  const events: GameEvent[] = [];

  events.push({
    type: "narrator",
    speaker: "Narrator",
    text: `Welcome to this game of Avalon. ${game.players.length} players are seated at the table. Let the game begin.`,
    phase: "Introduction",
  });

  for (let mi = 0; mi < game.missions.length; mi++) {
    const mission: Mission = game.missions[mi];
    const teamSize = game.config.mission_team_sizes[mi];
    const missionLabel = `Mission ${mi + 1}`;

    events.push({
      type: "narrator",
      speaker: "Narrator",
      text: `${missionLabel} begins. The team size is ${teamSize}.`,
      phase: `${missionLabel} - Start`,
      missionIndex: mi,
    });

    // Discussion
    for (const msg of mission.discussion) {
      events.push({
        type: "player",
        speaker: msg.player,
        text: msg.content,
        phase: `${missionLabel} - Discussion`,
        missionIndex: mi,
      });
    }

    // Proposals
    for (let pi = 0; pi < mission.proposals.length; pi++) {
      const proposal = mission.proposals[pi];

      events.push({
        type: "narrator",
        speaker: "Narrator",
        text: `${proposal.leader} proposes a team: ${proposal.team_members.join(", ")}.`,
        phase: `${missionLabel} - Proposal ${pi + 1}`,
        missionIndex: mi,
      });

      // Votes
      for (const vote of proposal.votes) {
        const voteWord = vote.vote === "approve" ? "Approve" : "Reject";
        const comment = vote.comment ? ` ${vote.comment}` : "";
        events.push({
          type: "player",
          speaker: vote.player,
          text: `${voteWord}.${comment}`,
          phase: `${missionLabel} - Voting`,
          missionIndex: mi,
        });
      }

      events.push({
        type: "narrator",
        speaker: "Narrator",
        text: `The proposal is ${proposal.vote_result}.`,
        phase: `${missionLabel} - Vote Result`,
        missionIndex: mi,
      });
    }

    // Quest result
    if (mission.mission_result) {
      const failCount = mission.fail_count ?? 0;
      events.push({
        type: "narrator",
        speaker: "Narrator",
        text: `The quest ${mission.mission_result === "success" ? "succeeds" : "fails"} with ${failCount} fail card${failCount !== 1 ? "s" : ""}.`,
        phase: `${missionLabel} - Result`,
        missionIndex: mi,
      });
    }
  }

  // Assassin phase
  if (game.assassin_phase) {
    events.push({
      type: "narrator",
      speaker: "Narrator",
      text: "Three missions have succeeded. The Assassin phase begins. The evil team must identify Merlin.",
      phase: "Assassin Phase",
    });

    for (const msg of game.assassin_phase.evil_discussion) {
      events.push({
        type: "player",
        speaker: msg.player,
        text: msg.content,
        phase: "Assassin Phase - Discussion",
      });
    }

    const correct = game.assassin_phase.correct;
    events.push({
      type: "narrator",
      speaker: "Narrator",
      text: `The assassin ${game.assassin_phase.assassin} targets ${game.assassin_phase.guess}. ${correct ? "Correct! Evil wins by assassinating Merlin!" : "Wrong! Good wins — Merlin survives!"}`,
      phase: "Assassin Phase - Result",
    });
  }

  // Final
  events.push({
    type: "narrator",
    speaker: "Narrator",
    text: `The game is over. ${game.winner === "good" ? "Good" : "Evil"} wins!`,
    phase: "Game Over",
  });

  return events;
}

type PlaybackSpeed = 1 | 1.5 | 2;

export default function AutoPlayViewer({
  game,
  gameNumber,
  memories,
  gameIndex,
}: AutoPlayViewerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(-1);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [memoryPlayer, setMemoryPlayer] = useState<string | null>(null);

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

  const isPlayingRef = useRef(false);
  const currentIndexRef = useRef(-1);
  const speedRef = useRef<PlaybackSpeed>(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    currentIndexRef.current = currentEventIndex;
  }, [currentEventIndex]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const events = useMemo(() => buildEventSequence(game), [game]);

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

  const currentEvent =
    currentEventIndex >= 0 && currentEventIndex < events.length
      ? events[currentEventIndex]
      : null;

  const activeSpeaker =
    currentEvent?.type === "player" ? currentEvent.speaker : null;

  // Calculate delay based on text length and speed
  function getDelay(text: string, speedMultiplier: number): number {
    const baseDelay = Math.min(Math.max(text.length * 30, 2000), 8000);
    return baseDelay / speedMultiplier;
  }

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const playSequence = useCallback(
    (startIndex: number) => {
      const scheduleNext = (i: number) => {
        if (i >= events.length || !isPlayingRef.current) {
          setIsPlaying(false);
          isPlayingRef.current = false;
          return;
        }

        setCurrentEventIndex(i);
        currentIndexRef.current = i;

        const delay = getDelay(events[i].text, speedRef.current);
        timerRef.current = setTimeout(() => {
          if (isPlayingRef.current) {
            scheduleNext(i + 1);
          }
        }, delay);
      };

      scheduleNext(startIndex);
    },
    [events],
  );

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      clearTimer();
    } else {
      setIsPlaying(true);
      isPlayingRef.current = true;
      const startIdx = currentEventIndex < 0 ? 0 : currentEventIndex;
      playSequence(startIdx);
    }
  }, [isPlaying, currentEventIndex, clearTimer, playSequence]);

  const handleRestart = useCallback(() => {
    clearTimer();
    setIsPlaying(false);
    isPlayingRef.current = false;
    setCurrentEventIndex(-1);
    currentIndexRef.current = -1;
  }, [clearTimer]);

  const handleSkipForward = useCallback(() => {
    const wasPlaying = isPlayingRef.current;
    isPlayingRef.current = false;
    clearTimer();
    const next = Math.min(currentIndexRef.current + 1, events.length - 1);
    setCurrentEventIndex(next);
    currentIndexRef.current = next;
    if (wasPlaying) {
      isPlayingRef.current = true;
      setIsPlaying(true);
      playSequence(next);
    }
  }, [clearTimer, events.length, playSequence]);

  const handleSkipToEnd = useCallback(() => {
    clearTimer();
    setIsPlaying(false);
    isPlayingRef.current = false;
    const lastIndex = events.length - 1;
    setCurrentEventIndex(lastIndex);
    currentIndexRef.current = lastIndex;
  }, [clearTimer, events.length]);

  const handleSkipBack = useCallback(() => {
    const wasPlaying = isPlayingRef.current;
    isPlayingRef.current = false;
    clearTimer();
    const prev = Math.max(currentIndexRef.current - 1, 0);
    setCurrentEventIndex(prev);
    currentIndexRef.current = prev;
    if (wasPlaying) {
      isPlayingRef.current = true;
      setIsPlaying(true);
      playSequence(prev);
    }
  }, [clearTimer, playSequence]);

  const handleExit = useCallback(() => {
    clearTimer();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("autoplay");
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [clearTimer, router, searchParams]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleSkipForward();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleSkipBack();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSkipForward, handleSkipBack]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  // Mission progress
  const missionResults = game.missions.map((m) => m.mission_result);

  const isAtEnd = currentEventIndex >= events.length - 1;

  // Only reveal mission results for missions that have been reached during playback
  const revealedMissionIndex = currentEvent?.missionIndex ?? -1;

  return (
    <div className="h-full bg-white text-gray-900 flex flex-col overflow-hidden">
      {/* Top bar: game info + mission progress */}
      <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExit}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
            title="Exit auto play"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 font-display">
              {gameNumber ? `Game ${gameNumber}` : "Avalon"}
            </h1>
            <p className="text-xs text-gray-500">
              {game.players.length} players &middot;{" "}
              {game.config.reasoning_effort} reasoning
            </p>
          </div>
        </div>

        {/* Mission tracker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase mr-1 font-display">
            Missions
          </span>
          {missionResults.map((result, idx) => {
            const revealed = idx <= revealedMissionIndex || isAtEnd;
            const teamSize = game.config.mission_team_sizes?.[idx];
            return (
              <div key={idx} className="flex flex-col items-center gap-0.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    revealed && result === "success"
                      ? "bg-blue-500 text-white"
                      : revealed && result === "fail"
                        ? "bg-red-500 text-white"
                        : "bg-gray-200 text-gray-400"
                  } ${currentEvent?.missionIndex === idx ? "ring-2 ring-yellow-400" : ""}`}
                >
                  {idx + 1}
                </div>
                {teamSize && (
                  <span className="text-[10px] text-gray-400">{teamSize}p</span>
                )}
              </div>
            );
          })}
        </div>

        {isAtEnd ? (
          <div
            className={`px-3 py-1 rounded text-sm font-medium ${
              game.winner === "good"
                ? "bg-blue-100 text-blue-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {game.winner} wins
          </div>
        ) : (
          <div className="px-3 py-1 rounded text-sm font-medium bg-gray-100 text-gray-400 font-display">
            ?
          </div>
        )}
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Players row */}
        <div className="flex-shrink-0 px-6 py-6 flex justify-center gap-4">
          {game.players.map((player, idx) => {
            const isSpeaking = activeSpeaker === player.name;

            return (
              <div
                key={player.name}
                className={`flex flex-col items-center transition-all duration-300 ${
                  isSpeaking
                    ? "scale-110 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                    : ""
                }`}
              >
                <PlayerCard
                  player={player}
                  size="2xl"
                  isActive={isSpeaking}
                  loyalServantIndex={loyalServantIndexMap[player.name]}
                  onMemoryClick={
                    hasMemories ? () => setMemoryPlayer(player.name) : undefined
                  }
                />
              </div>
            );
          })}
        </div>

        {/* Speech bubble */}
        <div className="flex-1 flex items-center justify-center px-6">
          {currentEvent ? (
            <div
              className={`rounded-2xl px-8 py-6 shadow-md max-w-2xl w-full ${
                currentEvent.type === "narrator"
                  ? "bg-gray-100 border border-gray-200"
                  : "bg-white border border-gray-200 shadow-lg"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`text-base font-bold uppercase font-display ${
                    currentEvent.type === "narrator"
                      ? "text-gray-500"
                      : "text-blue-600"
                  }`}
                >
                  {currentEvent.speaker}
                </span>
                <span className="text-sm text-gray-400 font-display">
                  {currentEvent.phase}
                </span>
              </div>
              <p className="text-lg leading-relaxed text-gray-800">
                {currentEvent.text}
              </p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Press play to begin</p>
          )}
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 flex items-center justify-center gap-4">
        {/* Restart */}
        <button
          onClick={handleRestart}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          title="Restart"
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
            <path d="M3 12a9 9 0 1 1 9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 22v-6h6" />
          </svg>
        </button>

        {/* Skip back */}
        <button
          onClick={handleSkipBack}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          title="Previous"
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
            <polygon points="19 20 9 12 19 4 19 20" />
            <line x1="5" y1="19" x2="5" y2="5" />
          </svg>
        </button>

        {/* Play / Pause */}
        <button
          onClick={handlePlayPause}
          className="w-14 h-14 rounded-full bg-gray-900 hover:bg-gray-700 text-white flex items-center justify-center transition-colors"
          title={isPlaying ? "Pause" : "Auto Play"}
        >
          {isPlaying ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        {/* Skip forward */}
        <button
          onClick={handleSkipForward}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          title="Next"
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
            <polygon points="5 4 15 12 5 20 5 4" />
            <line x1="19" y1="5" x2="19" y2="19" />
          </svg>
        </button>

        {/* Skip to end */}
        <button
          onClick={handleSkipToEnd}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          title="Skip to end"
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
            <polygon points="5 4 15 12 5 20 5 4" />
            <polygon points="13 4 23 12 13 20 13 4" />
          </svg>
        </button>

        {/* Speed control */}
        <div className="flex items-center gap-1 ml-4">
          {([1, 1.5, 2] as PlaybackSpeed[]).map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                speed === s
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-500 hover:text-gray-700"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Progress */}
        <div className="ml-4 text-xs text-gray-400">
          {currentEventIndex >= 0 ? currentEventIndex + 1 : 0} / {events.length}
        </div>
      </div>

      {/* Memory Modal */}
      {memoryPlayer && hasMemories && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setMemoryPlayer(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 font-display">
                  {memoryPlayer}&apos;s Memories
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Reflections going into Game {(gameIndex ?? 0) + 1} (from games
                  1&ndash;{gameIndex})
                </p>
              </div>
              <div className="flex items-center gap-2">
                {game.players.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setMemoryPlayer(p.name)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      memoryPlayer === p.name
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
                <button
                  onClick={() => setMemoryPlayer(null)}
                  className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
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
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {getPlayerReflections(memoryPlayer).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No memories available for this player.
                </p>
              ) : (
                <div className="space-y-4">
                  {getPlayerReflections(memoryPlayer).map((reflection) => (
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
                      {Object.keys(reflection.player_observations).length >
                        0 && (
                        <div>
                          <div className="text-xs text-gray-500 uppercase font-medium mb-1">
                            Observations
                          </div>
                          <div className="space-y-1.5">
                            {Object.entries(reflection.player_observations).map(
                              ([name, observation]) => {
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
                              },
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
