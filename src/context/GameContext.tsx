"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { type Bloc, type Party } from "@/src/data/parties";

export type Guess = {
  id: string;
  name: string;
  party: Party;
  bloc: Bloc;
  blocGuess: Bloc;
  partyGuess: Party;
  isBlocCorrect: boolean;
  isPartyCorrect: boolean;
};

interface GameContextType {
  guesses: Guess[];
  addGuess: (guess: Guess) => void;
  clearGuesses: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [guesses, setGuesses] = useState<Guess[]>([]);

  useEffect(() => {
    // Cleanup old global/session storage from previous versions
    if (typeof window !== "undefined") {
      localStorage.removeItem("deputadosGuessResults");
      sessionStorage.removeItem("deputadosGuessResults");
    }
  }, []);

  const addGuess = (guess: Guess) => {
    setGuesses((prev) => [...prev, guess]);
  };

  const clearGuesses = () => {
    setGuesses([]);
  };

  return (
    <GameContext.Provider value={{ guesses, addGuess, clearGuesses }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
