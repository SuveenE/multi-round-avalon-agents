"use client";

import { useState, useEffect, useRef } from "react";
import { TournamentInfo } from "@/types/game";
import { getBasePath } from "@/lib/config";

interface GameSelectorProps {
  onSelectGame: (tournamentPath: string, gameId: string, tournamentIndex: number, gameIndex: number) => void;
  collapsed: boolean;
  onToggle: () => void;
  initialTournamentIndex: number | null;
  initialGameIndex: number | null;
}

interface GameInfo {
  id: string;
  winner: string;
  players: number;
}

export default function GameSelector({
  onSelectGame,
  collapsed,
  onToggle,
  initialTournamentIndex,
  initialGameIndex,
}: GameSelectorProps) {
  const [tournaments, setTournaments] = useState<TournamentInfo[]>([]);
  const [selectedTournamentIndex, setSelectedTournamentIndex] = useState<number | null>(null);
  const [games, setGames] = useState<GameInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGameIndex, setSelectedGameIndex] = useState<number | null>(null);
  const initialLoadDone = useRef(false);

  // Load tournaments
  useEffect(() => {
    const basePath = getBasePath();
    fetch(`${basePath}/data/tournaments.json`)
      .then((res) => res.json())
      .then((data) => {
        setTournaments(data);
        setLoading(false);
      });
  }, []);

  // Handle initial selection from URL params
  useEffect(() => {
    if (
      !initialLoadDone.current &&
      tournaments.length > 0 &&
      initialTournamentIndex !== null &&
      initialTournamentIndex < tournaments.length
    ) {
      setSelectedTournamentIndex(initialTournamentIndex);
    }
  }, [tournaments, initialTournamentIndex]);

  // Load games when tournament is selected
  useEffect(() => {
    if (selectedTournamentIndex !== null && tournaments[selectedTournamentIndex]) {
      setLoading(true);
      const basePath = getBasePath();
      const tournament = tournaments[selectedTournamentIndex];
      fetch(`${basePath}/data/${tournament.path}/index.json`)
        .then((res) => res.json())
        .then((data) => {
          setGames(data);
          setLoading(false);

          // Auto-select game from URL on initial load
          if (
            !initialLoadDone.current &&
            initialGameIndex !== null &&
            initialGameIndex < data.length
          ) {
            initialLoadDone.current = true;
            setSelectedGameIndex(initialGameIndex);
            const game = data[initialGameIndex];
            onSelectGame(tournament.path, game.id, selectedTournamentIndex, initialGameIndex);
          }
        });
    }
  }, [selectedTournamentIndex, tournaments, initialGameIndex, onSelectGame]);

  const selectedTournament = selectedTournamentIndex !== null ? tournaments[selectedTournamentIndex] : null;

  // Build flat list with indices for proper indexing
  const flatTournamentList = tournaments.map((t, idx) => ({ ...t, globalIndex: idx }));

  const groupedTournaments = flatTournamentList.reduce(
    (acc, t) => {
      // Group by dataset letter (A, B, C, D) or legacy format
      let key: string;
      if (t.name.startsWith("A:")) {
        key = "A: Cross-Game Learning";
      } else if (t.name.startsWith("B:")) {
        key = "B: Tournaments (Memory)";
      } else if (t.name.startsWith("C:")) {
        key = "C: Individual Games (No Memory)";
      } else if (t.name.startsWith("D:")) {
        key = "D: Reasoning Comparison";
      } else if (t.path.startsWith("individual")) {
        key = "Individual Games";
      } else {
        key = "Tournaments";
      }
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    },
    {} as Record<string, (TournamentInfo & { globalIndex: number })[]>
  );

  const handleSelectGame = (gameIndex: number) => {
    if (selectedTournament && selectedTournamentIndex !== null) {
      setSelectedGameIndex(gameIndex);
      onSelectGame(selectedTournament.path, games[gameIndex].id, selectedTournamentIndex, gameIndex);
    }
  };

  const handleBack = () => {
    setSelectedTournamentIndex(null);
    setGames([]);
    setSelectedGameIndex(null);
  };

  if (collapsed) {
    return (
      <div className="w-12 h-full bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={onToggle}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 transition-colors text-gray-700"
          title="Expand sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    );
  }

  // Show games view when tournament is selected
  if (selectedTournament) {
    return (
      <div className="w-64 h-full bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              Back
            </button>
            <button
              onClick={onToggle}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 transition-colors text-gray-700"
              title="Collapse sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {selectedTournament.players}p · {selectedTournament.games}g · {selectedTournament.reasoning}
            {selectedTournament.hasMemory && " · mem"}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <h3 className="text-xs font-medium text-gray-400 uppercase px-2 mb-2">
            Select Game
          </h3>
          {loading ? (
            <div className="text-center py-4 text-gray-400 text-sm">Loading...</div>
          ) : (
            <div className="grid grid-cols-5 gap-1">
              {games.map((game, idx) => (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(idx)}
                  className={`aspect-square rounded flex items-center justify-center text-sm font-medium transition-colors ${
                    selectedGameIndex === idx
                      ? "ring-2 ring-gray-400 ring-offset-1"
                      : ""
                  } ${
                    game.winner === "good"
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      : "bg-red-100 text-red-700 hover:bg-red-200"
                  }`}
                  title={`Game ${idx + 1} - ${game.winner} wins`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show tournaments list
  return (
    <div className="w-64 h-full bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Tournaments</h2>
        <button
          onClick={onToggle}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 transition-colors text-gray-700"
          title="Collapse sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-center py-4 text-gray-400 text-sm">Loading...</div>
        ) : (
          <>
            {Object.entries(groupedTournaments).map(([group, items]) => (
              <div key={group} className="mb-3">
                <h3 className="text-xs font-medium text-gray-400 uppercase px-2 mb-1">
                  {group}
                </h3>
                {items.map((t) => (
                  <button
                    key={t.path}
                    onClick={() => setSelectedTournamentIndex(t.globalIndex)}
                    className="w-full text-left px-2 py-1.5 rounded text-sm transition-colors text-gray-600 hover:bg-gray-100"
                  >
                    <span className="font-medium">
                      {t.name.includes(":") ? t.name.split(": ")[1] : `${t.players}p · ${t.games}g · ${t.reasoning}${t.hasMemory ? " · mem" : ""}`}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
