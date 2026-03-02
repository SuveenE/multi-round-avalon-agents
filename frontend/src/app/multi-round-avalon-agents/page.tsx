"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AutoPlayViewer from "@/components/AutoPlayViewer";
import { Game, TournamentInfo } from "@/types/game";
import { getBasePath } from "@/lib/config";

function AutoPlayContent() {
  const searchParams = useSearchParams();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tournamentIndex = searchParams.get("tournament")
    ? parseInt(searchParams.get("tournament")!)
    : null;
  const gameIndex = searchParams.get("game")
    ? parseInt(searchParams.get("game")!)
    : null;

  const loadGame = useCallback(async () => {
    if (tournamentIndex === null || gameIndex === null) {
      setError("Missing tournament or game parameter. Use ?tournament=0&game=0");
      setLoading(false);
      return;
    }

    try {
      const basePath = getBasePath();

      // Load tournament list
      const tournamentsRes = await fetch(`${basePath}/data/tournaments.json`);
      const tournaments: TournamentInfo[] = await tournamentsRes.json();

      if (tournamentIndex >= tournaments.length) {
        setError(`Tournament index ${tournamentIndex} out of range (max ${tournaments.length - 1})`);
        setLoading(false);
        return;
      }

      const tournament = tournaments[tournamentIndex];

      // Load game index to get game ID
      const indexRes = await fetch(`${basePath}/data/${tournament.path}/index.json`);
      const gameList = await indexRes.json();

      if (gameIndex >= gameList.length) {
        setError(`Game index ${gameIndex} out of range (max ${gameList.length - 1})`);
        setLoading(false);
        return;
      }

      const gameId = gameList[gameIndex].id;

      // Load full game data
      const gamesRes = await fetch(`${basePath}/data/${tournament.path}/all_games.json`);
      const gamesData = await gamesRes.json();
      const foundGame = gamesData.games.find((g: Game) => g.game_id === gameId);

      if (!foundGame) {
        setError(`Game ${gameId} not found in data`);
        setLoading(false);
        return;
      }

      setGame(foundGame);
    } catch (err) {
      setError(`Failed to load game: ${err}`);
    }
    setLoading(false);
  }, [tournamentIndex, gameIndex]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  if (loading) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        Loading game...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <a href="/" className="text-blue-400 hover:underline text-sm">
            Back to game viewer
          </a>
        </div>
      </div>
    );
  }

  if (!game) return null;

  return <AutoPlayViewer game={game} gameNumber={gameIndex !== null ? gameIndex + 1 : undefined} />;
}

export default function AutoPlayPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-gray-950 flex items-center justify-center text-gray-400">
          Loading...
        </div>
      }
    >
      <AutoPlayContent />
    </Suspense>
  );
}
