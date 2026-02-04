"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import GameSelector from "@/components/GameSelector";
import GameViewer from "@/components/GameViewer";
import { Game } from "@/types/game";
import { getBasePath } from "@/lib/config";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Get initial indices from URL
  const initialTournamentIndex = searchParams.get("tournament") ? parseInt(searchParams.get("tournament")!) : null;
  const initialGameIndex = searchParams.get("game") ? parseInt(searchParams.get("game")!) : null;

  const updateUrl = useCallback((tournamentIndex: number, gameIndex: number) => {
    const params = new URLSearchParams();
    params.set("tournament", tournamentIndex.toString());
    params.set("game", gameIndex.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router]);

  const handleSelectGame = async (
    tournamentPath: string,
    gameId: string,
    tournamentIndex: number,
    gameIndex: number
  ) => {
    setLoading(true);
    updateUrl(tournamentIndex, gameIndex);
    try {
      const basePath = getBasePath();
      const res = await fetch(`${basePath}/data/${tournamentPath}/all_games.json`);
      const data = await res.json();
      const game = data.games.find((g: Game) => g.game_id === gameId);
      if (game) {
        setSelectedGame(game);
      }
    } catch (error) {
      console.error("Failed to load game:", error);
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-white">
      <GameSelector
        onSelectGame={handleSelectGame}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        initialTournamentIndex={initialTournamentIndex}
        initialGameIndex={initialGameIndex}
      />
      <div className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Loading...
          </div>
        ) : selectedGame ? (
          <GameViewer game={selectedGame} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="text-4xl mb-3">🏰</div>
            <h1 className="text-lg font-medium text-gray-600 mb-1">Avalon Game Viewer</h1>
            <p className="text-sm mb-4">Select a game from the sidebar</p>
            <Link
              href="/players"
              className="text-sm px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
            >
              View Character Guide
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-white items-center justify-center text-gray-400">
        Loading...
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
