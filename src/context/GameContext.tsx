"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { type Bloc, type Party } from "@/src/data/parties";

export type GuessType = "deputy" | "project";

export type Guess = {
  id: string;
  name: string;
  type?: GuessType;
  party: Party;
  bloc: Bloc;
  blocGuess: Bloc;
  partyGuess: Party;
  isBlocCorrect: boolean;
  isPartyCorrect: boolean;
};

const GUESSES_STORAGE_KEY = "deputavasGuesses";
const PROJECT_GUESSES_STORAGE_KEY = "deputavasProjectGuesses";

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
        (guess.type === undefined || guess.type === "deputy" || guess.type === "project") &&
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
  projectGuesses: Guess[];
  addGuess: (guess: Guess) => void;
  addProjectGuess: (guess: Guess) => void;
  clearGuesses: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [guesses, setGuesses] = useState<Guess[]>(() => {
    if (typeof window === "undefined") return [];
    return parseStoredGuesses(localStorage.getItem(GUESSES_STORAGE_KEY));
  });
  const [projectGuesses, setProjectGuesses] = useState<Guess[]>(() => {
    if (typeof window === "undefined") return [];
    return parseStoredGuesses(localStorage.getItem(PROJECT_GUESSES_STORAGE_KEY));
  });
  const hasInitializedStorageRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Cleanup old global/session storage from previous versions
      localStorage.removeItem("deputadosGuessResults");
      sessionStorage.removeItem("deputadosGuessResults");
      hasInitializedStorageRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (hasInitializedStorageRef.current && typeof window !== "undefined") {
      localStorage.setItem(GUESSES_STORAGE_KEY, JSON.stringify(guesses));
      localStorage.setItem(PROJECT_GUESSES_STORAGE_KEY, JSON.stringify(projectGuesses));
    }
  }, [guesses, projectGuesses]);

  const addGuess = (guess: Guess) => {
    setGuesses((prev) => [...prev, guess]);
  };

  const addProjectGuess = (guess: Guess) => {
    setProjectGuesses((prev) => [...prev, guess]);
  };

  const clearGuesses = () => {
    setGuesses([]);
    setProjectGuesses([]);
  };

  return (
    <GameContext.Provider value={{ guesses, projectGuesses, addGuess, addProjectGuess, clearGuesses }}>
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
