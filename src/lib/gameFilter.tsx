import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { GameId } from "./games";

interface GameFilterCtx {
  game: GameId;
  setGame: (g: GameId) => void;
}

const Ctx = createContext<GameFilterCtx | null>(null);
const KEY = "pokemon-guide-game";

export function GameFilterProvider({ children }: { children: ReactNode }) {
  const [game, setGameState] = useState<GameId>("all");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const s = localStorage.getItem(KEY) as GameId | null;
    if (s && ["all", "letsgo", "swsh", "arceus", "sv"].includes(s)) setGameState(s);
  }, []);
  const setGame = (g: GameId) => {
    setGameState(g);
    if (typeof window !== "undefined") localStorage.setItem(KEY, g);
  };
  return <Ctx.Provider value={{ game, setGame }}>{children}</Ctx.Provider>;
}

export function useGameFilter() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useGameFilter must be inside GameFilterProvider");
  return c;
}
