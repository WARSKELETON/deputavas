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

export type BadgeId = "streak_3" | "streak_7" | "perfect_score";

export type StreakState = {
  lastPlayedDate: string | null;
  currentStreak: number;
  bestStreak: number;
  totalDaysPlayed: number;
  badges: BadgeId[];
};

export const BADGE_DETAILS: Record<BadgeId, { title: string; description: string }> = {
  streak_3: {
    title: "3 dias seguidos",
    description: "Joga durante 3 dias seguidos.",
  },
  streak_7: {
    title: "7 dias seguidos",
    description: "Mantem a sequencia por uma semana inteira.",
  },
  perfect_score: {
    title: "Pontuacao perfeita",
    description: "Faz 100% de precisao numa partida.",
  },
};

const STREAK_STORAGE_KEY = "deputavasStreaks";
const GUESSES_STORAGE_KEY = "deputavasGuesses";

const DEFAULT_STREAK_STATE: StreakState = {
  lastPlayedDate: null,
  currentStreak: 0,
  bestStreak: 0,
  totalDaysPlayed: 0,
  badges: [],
};

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateFromString(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function isYesterday(lastDate: string, todayDate: string) {
  const last = getDateFromString(lastDate);
  const today = getDateFromString(todayDate);
  const diffMs = today.getTime() - last.getTime();
  return Math.round(diffMs / 86400000) === 1;
}

function parseStoredStreakState(raw: string | null): StreakState {
  if (!raw) return DEFAULT_STREAK_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<StreakState>;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !Array.isArray(parsed.badges)
    ) {
      return DEFAULT_STREAK_STATE;
    }
    return {
      lastPlayedDate: typeof parsed.lastPlayedDate === "string" ? parsed.lastPlayedDate : null,
      currentStreak: typeof parsed.currentStreak === "number" ? parsed.currentStreak : 0,
      bestStreak: typeof parsed.bestStreak === "number" ? parsed.bestStreak : 0,
      totalDaysPlayed: typeof parsed.totalDaysPlayed === "number" ? parsed.totalDaysPlayed : 0,
      badges: parsed.badges.filter((badge): badge is BadgeId =>
        badge === "streak_3" || badge === "streak_7" || badge === "perfect_score"
      ),
    };
  } catch {
    return DEFAULT_STREAK_STATE;
  }
}

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
  streakState: StreakState;
  recordCompletion: (payload: {
    total: number;
    correct: number;
  }) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [guesses, setGuesses] = useState<Guess[]>(() => {
    if (typeof window !== "undefined") {
      // Cleanup old global/session storage from previous versions
      localStorage.removeItem("deputadosGuessResults");
      sessionStorage.removeItem("deputadosGuessResults");
      return parseStoredGuesses(localStorage.getItem(GUESSES_STORAGE_KEY));
    }
    return [];
  });
  
  const [streakState, setStreakState] = useState<StreakState>(() => {
    if (typeof window !== "undefined") {
      return parseStoredStreakState(localStorage.getItem(STREAK_STORAGE_KEY));
    }
    return DEFAULT_STREAK_STATE;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streakState));
    }
  }, [streakState]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(GUESSES_STORAGE_KEY, JSON.stringify(guesses));
    }
  }, [guesses]);

  const addGuess = (guess: Guess) => {
    setGuesses((prev) => [...prev, guess]);
  };

  const clearGuesses = () => {
    setGuesses([]);
  };

  const recordCompletion = ({ total, correct }: { total: number; correct: number }) => {
    const today = getLocalDateString();
    setStreakState((prev) => {
      let currentStreak = prev.currentStreak;
      let bestStreak = prev.bestStreak;
      let totalDaysPlayed = prev.totalDaysPlayed;
      let lastPlayedDate = prev.lastPlayedDate;

      if (lastPlayedDate !== today) {
        totalDaysPlayed += 1;
        if (lastPlayedDate && isYesterday(lastPlayedDate, today)) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
        bestStreak = Math.max(bestStreak, currentStreak);
        lastPlayedDate = today;
      }

      const badges = [...prev.badges];
      if (!badges.includes("streak_3") && currentStreak >= 3) {
        badges.push("streak_3");
      }
      if (!badges.includes("streak_7") && currentStreak >= 7) {
        badges.push("streak_7");
      }
      if (!badges.includes("perfect_score") && total > 0 && correct === total) {
        badges.push("perfect_score");
      }

      return {
        lastPlayedDate,
        currentStreak,
        bestStreak,
        totalDaysPlayed,
        badges,
      };
    });
  };

  return (
    <GameContext.Provider value={{ guesses, addGuess, clearGuesses, streakState, recordCompletion }}>
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
