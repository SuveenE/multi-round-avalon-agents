"use client";

import Image from "next/image";
import { Player } from "@/types/game";
import { getBasePath } from "@/lib/config";

interface PlayerCardProps {
  player: Player;
  isActive?: boolean;
  showRole?: boolean;
  size?: "sm" | "md" | "lg";
  loyalServantIndex?: number;
}

const roleToImage: Record<string, string> = {
  merlin: "/assets/merlin.png",
  percival: "/assets/percival.png",
  assassin: "/assets/assassin.png",
  morgana: "/assets/morgana.png",
  mordred: "/assets/mordred.png",
  oberon: "/assets/oberon.png",
  evil: "/assets/minion.png",
};

const loyalServantImages = [
  "/assets/loyal-servant-1.png",
  "/assets/loyal-servant-2.png",
  "/assets/loyal-servant-3.png",
  "/assets/loyal-servant-4.png",
];

// Simple hash to consistently assign the same image to the same player name
function getImageIndexFromName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % loyalServantImages.length;
}

export default function PlayerCard({
  player,
  isActive = false,
  showRole = true,
  size = "md",
  loyalServantIndex,
}: PlayerCardProps) {
  const sizeClasses = {
    sm: "w-14 h-14",
    md: "w-20 h-20",
    lg: "w-24 h-24",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const basePath = getBasePath();

  // Use unique loyal servant images for generic good roles
  let roleImage: string;
  if (player.role === "good") {
    // Use provided index for uniqueness, fallback to hash if not provided
    const idx = loyalServantIndex !== undefined
      ? loyalServantIndex % loyalServantImages.length
      : getImageIndexFromName(player.name);
    roleImage = loyalServantImages[idx];
  } else {
    roleImage = roleToImage[player.role] || loyalServantImages[0];
  }
  const imagePath = basePath + roleImage;

  return (
    <div
      className={`flex flex-col items-center gap-0.5 p-1.5 rounded transition-all ${
        isActive ? "bg-blue-100 ring-1 ring-blue-400" : "bg-gray-50"
      }`}
    >
      <div
        className={`${sizeClasses[size]} relative rounded-full overflow-hidden border ${
          player.is_good ? "border-blue-300" : "border-red-300"
        }`}
      >
        <Image
          src={imagePath}
          alt={player.role}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <span className={`font-medium ${textSizes[size]} text-gray-900`}>{player.name}</span>
      {showRole && (
        <span
          className={`${textSizes[size]} px-1.5 py-0.5 rounded text-xs ${
            player.is_good
              ? "bg-blue-100 text-blue-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {player.role}
        </span>
      )}
    </div>
  );
}
