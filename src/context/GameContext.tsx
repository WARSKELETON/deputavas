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

const GUESSES_STORAGE_KEY = "deputavasGuesses";

function parseStoredGuesses(raw: string | null): Guess[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((guess): guess is Guess => {
      return (
        typeof guess === "object" &&
        guess !== null &&
        typeof guess.id === "string" &&
        typeof guess.name === "string" &&
        typeof guess.party === "string" &&
        typeof guess.bloc === "string" &&
        typeof guess.blocGuess === "string" &&
        typeof guess.partyGuess === "string" &&
        typeof guess.isBlocCorrect === "boolean" &&
        typeof guess.isPartyCorrect === "boolean"
      );
    });
  } catch {
    return [];
  }
}

interface GameContextType {
  guesses: Guess[];
  addGuess: (guess: Guess) => void;
  clearGuesses: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Cleanup old global/session storage from previous versions
      localStorage.removeItem("deputadosGuessResults");
      sessionStorage.removeItem("deputadosGuessResults");
      
      const storedGuesses = parseStoredGuesses(localStorage.getItem(GUESSES_STORAGE_KEY));
      
      setGuesses(storedGuesses);
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (isHydrated && typeof window !== "undefined") {
      localStorage.setItem(GUESSES_STORAGE_KEY, JSON.stringify(guesses));
    }
  }, [guesses, isHydrated]);

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
