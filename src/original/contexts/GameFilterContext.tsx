import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type GameId = "all" | "letsgo" | "swsh" | "arceus" | "sv";

interface GameInfo {
  id: GameId;
  labelEn: string;
  labelAr: string;
  fullNameEn: string;
  fullNameAr: string;
}

export const GAMES: GameInfo[] = [
  {
    id: "all",
    labelEn: "All",
    labelAr: "الكل",
    fullNameEn: "All Games",
    fullNameAr: "جميع الألعاب",
  },
  {
    id: "letsgo",
    labelEn: "Let's Go",
    labelAr: "ليتس غو",
    fullNameEn: "Let's Go Pikachu/Eevee",
    fullNameAr: "ليتس غو بيكاتشو/إيفي",
  },
  {
    id: "swsh",
    labelEn: "Sword/Shield",
    labelAr: "سورد/شيلد",
    fullNameEn: "Sword/Shield + DLC",
    fullNameAr: "سورد/شيلد + DLC",
  },
  {
    id: "arceus",
    labelEn: "Arceus",
    labelAr: "آرسيوس",
    fullNameEn: "Legends: Arceus",
    fullNameAr: "أساطير: آرسيوس",
  },
  {
    id: "sv",
    labelEn: "Scarlet/Violet",
    labelAr: "سكارليت/فيوليت",
    fullNameEn: "Scarlet/Violet + DLC",
    fullNameAr: "سكارليت/فيوليت + DLC",
  },
];

interface GameFilterContextType {
  selectedGame: GameId;
  setSelectedGame: (game: GameId) => void;
  isAvailableInGame: (availableIn: string[] | null | undefined) => boolean;
  getGameInfo: (gameId: GameId) => GameInfo | undefined;
}

const GameFilterContext = createContext<GameFilterContextType | undefined>(undefined);

const STORAGE_KEY = "pokemon-guide-game-filter";

const isGameId = (value: string | null): value is GameId => {
  return GAMES.some((game) => game.id === value);
};

export const GameFilterProvider = ({ children }: { children: ReactNode }) => {
  const [selectedGame, setSelectedGameState] = useState<GameId>(() => {
    if (typeof window === "undefined") return "all";

    const saved = localStorage.getItem(STORAGE_KEY);
    return isGameId(saved) ? saved : "all";
  });

  useEffect(() => {
    document.documentElement.dataset.gameWorld = selectedGame;
  }, [selectedGame]);

  const setSelectedGame = (game: GameId) => {
    setSelectedGameState(game);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, game);
    }
  };

  const isAvailableInGame = (availableIn: string[] | null | undefined): boolean => {
    if (selectedGame === "all") return true;
    if (!availableIn || !Array.isArray(availableIn)) return true; // Show if no availability data
    return availableIn.includes(selectedGame);
  };

  const getGameInfo = (gameId: GameId) => GAMES.find((g) => g.id === gameId);

  return (
    <GameFilterContext.Provider
      value={{ selectedGame, setSelectedGame, isAvailableInGame, getGameInfo }}
    >
      {children}
    </GameFilterContext.Provider>
  );
};

export const useGameFilter = () => {
  const context = useContext(GameFilterContext);
  if (!context) {
    throw new Error("useGameFilter must be used within a GameFilterProvider");
  }
  return context;
};
