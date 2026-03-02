"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Game, Mission } from "@/types/game";
import PlayerCard from "./PlayerCard";
import { useSpeechSynthesis, VoiceConfig } from "@/hooks/useSpeechSynthesis";

interface AutoPlayViewerProps {
  game: Game;
  gameNumber?: number;
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

export default function AutoPlayViewer({ game, gameNumber }: AutoPlayViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(-1);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const { voices, speak, cancel, assignVoices, narratorConfig } = useSpeechSynthesis();

  const isPlayingRef = useRef(false);
  const currentIndexRef = useRef(-1);
  const speedRef = useRef<PlaybackSpeed>(1);

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

  const voiceMap = useMemo(() => {
    if (voices.length === 0) return {};
    return assignVoices(game.players.map((p) => p.name));
  }, [voices, game.players, assignVoices]);

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

  const currentEvent = currentEventIndex >= 0 && currentEventIndex < events.length
    ? events[currentEventIndex]
    : null;

  const activeSpeaker = currentEvent?.type === "player" ? currentEvent.speaker : null;

  const playSequence = useCallback(
    async (startIndex: number) => {
      for (let i = startIndex; i < events.length; i++) {
        if (!isPlayingRef.current) break;

        setCurrentEventIndex(i);
        currentIndexRef.current = i;

        const event = events[i];
        let config: VoiceConfig;
        if (event.type === "narrator") {
          config = narratorConfig;
        } else {
          config = voiceMap[event.speaker] || narratorConfig;
        }

        await speak(event.text, config, speedRef.current);

        if (!isPlayingRef.current) break;
      }

      // Finished
      setIsPlaying(false);
      isPlayingRef.current = false;
    },
    [events, narratorConfig, voiceMap, speak]
  );

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      cancel();
    } else {
      setIsPlaying(true);
      isPlayingRef.current = true;
      const startIdx = currentEventIndex < 0 ? 0 : currentEventIndex;
      playSequence(startIdx);
    }
  }, [isPlaying, currentEventIndex, cancel, playSequence]);

  const handleRestart = useCallback(() => {
    cancel();
    setIsPlaying(false);
    isPlayingRef.current = false;
    setCurrentEventIndex(-1);
    currentIndexRef.current = -1;
  }, [cancel]);

  const handleSkipForward = useCallback(() => {
    cancel();
    const next = Math.min(currentIndexRef.current + 1, events.length - 1);
    setCurrentEventIndex(next);
    currentIndexRef.current = next;
    if (isPlayingRef.current) {
      playSequence(next);
    }
  }, [cancel, events.length, playSequence]);

  const handleSkipToEnd = useCallback(() => {
    cancel();
    setIsPlaying(false);
    isPlayingRef.current = false;
    const lastIndex = events.length - 1;
    setCurrentEventIndex(lastIndex);
    currentIndexRef.current = lastIndex;
  }, [cancel, events.length]);

  const handleSkipBack = useCallback(() => {
    cancel();
    const prev = Math.max(currentIndexRef.current - 1, 0);
    setCurrentEventIndex(prev);
    currentIndexRef.current = prev;
    if (isPlayingRef.current) {
      playSequence(prev);
    }
  }, [cancel, playSequence]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  // Mission progress
  const missionResults = game.missions.map((m) => m.mission_result);

  const isAtEnd = currentEventIndex >= events.length - 1;

  // Only reveal mission results for missions that have been reached during playback
  const revealedMissionIndex = currentEvent?.missionIndex ?? -1;

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Top bar: game info + mission progress */}
      <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between border-b border-gray-800">
        <div>
          <h1 className="text-lg font-semibold">
            {gameNumber ? `Game ${gameNumber}` : "Avalon"}
          </h1>
          <p className="text-xs text-gray-400">
            {game.players.length} players &middot; {game.config.reasoning_effort} reasoning
          </p>
        </div>

        {/* Mission tracker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase mr-1">Missions</span>
          {missionResults.map((result, idx) => {
            const revealed = idx <= revealedMissionIndex || isAtEnd;
            return (
              <div
                key={idx}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  revealed && result === "success"
                    ? "bg-blue-500 text-white"
                    : revealed && result === "fail"
                    ? "bg-red-500 text-white"
                    : "bg-gray-700 text-gray-400"
                } ${currentEvent?.missionIndex === idx ? "ring-2 ring-yellow-400" : ""}`}
              >
                {idx + 1}
              </div>
            );
          })}
        </div>

        {isAtEnd ? (
          <div
            className={`px-3 py-1 rounded text-sm font-medium ${
              game.winner === "good"
                ? "bg-blue-900 text-blue-300"
                : "bg-red-900 text-red-300"
            }`}
          >
            {game.winner} wins
          </div>
        ) : (
          <div className="px-3 py-1 rounded text-sm font-medium bg-gray-800 text-gray-400">
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
                className={`transition-all duration-300 ${
                  isSpeaking
                    ? "scale-110 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]"
                    : ""
                }`}
              >
                <PlayerCard
                  player={player}
                  size="2xl"
                  isActive={isSpeaking}
                  loyalServantIndex={loyalServantIndexMap[player.name]}
                />
              </div>
            );
          })}
        </div>

        {/* Speech bubble */}
        <div className="flex-1 flex items-center justify-center px-6">
          {currentEvent ? (
            <div
              className={`rounded-xl px-6 py-4 shadow-lg max-w-lg w-full ${
                currentEvent.type === "narrator"
                  ? "bg-gray-800 border border-gray-600"
                  : "bg-white text-gray-900 border border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-sm font-bold uppercase ${
                    currentEvent.type === "narrator" ? "text-yellow-400" : "text-blue-600"
                  }`}
                >
                  {currentEvent.speaker}
                </span>
                <span className="text-xs text-gray-400">{currentEvent.phase}</span>
              </div>
              <p
                className={`text-base leading-relaxed ${
                  currentEvent.type === "narrator" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                {currentEvent.text}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Press play to begin</p>
          )}
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-800 flex items-center justify-center gap-4">
        {/* Restart */}
        <button
          onClick={handleRestart}
          className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title="Restart"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 1 9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 22v-6h6" />
          </svg>
        </button>

        {/* Skip back */}
        <button
          onClick={handleSkipBack}
          className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title="Previous"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="19 20 9 12 19 4 19 20" />
            <line x1="5" y1="19" x2="5" y2="5" />
          </svg>
        </button>

        {/* Play / Pause */}
        <button
          onClick={handlePlayPause}
          className="w-14 h-14 rounded-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 flex items-center justify-center transition-colors"
          title={isPlaying ? "Pause" : "Auto Play"}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        {/* Skip forward */}
        <button
          onClick={handleSkipForward}
          className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title="Next"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 4 15 12 5 20 5 4" />
            <line x1="19" y1="5" x2="19" y2="19" />
          </svg>
        </button>

        {/* Skip to end */}
        <button
          onClick={handleSkipToEnd}
          className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title="Skip to end"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  ? "bg-yellow-500 text-gray-900"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Progress */}
        <div className="ml-4 text-xs text-gray-500">
          {currentEventIndex >= 0 ? currentEventIndex + 1 : 0} / {events.length}
        </div>
      </div>
    </div>
  );
}
