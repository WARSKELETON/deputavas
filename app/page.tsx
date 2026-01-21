"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";

import deputados from "@/src/data/deputados.json";
import {
  partiesByBloc,
  partyMeta,
  type Bloc,
  type Party,
} from "@/src/data/parties";
import SwipeCard from "@/src/components/SwipeCard";

type Deputy = {
  id: string;
  name: string;
  party: string;
  legislature: string;
  photoUrl: string;
};

type Guess = {
  id: string;
  name: string;
  party: Party;
  bloc: Bloc;
  blocGuess: Bloc;
  partyGuess: Party;
  isBlocCorrect: boolean;
  isPartyCorrect: boolean;
};

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getBlocForParty(party: Party) {
  return partyMeta[party]?.bloc ?? "left";
}

export default function Home() {
  const [deck] = useState(() => shuffle(deputados as Deputy[]));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [round, setRound] = useState<"bloc" | "party" | "reveal">("bloc");
  const [blocGuess, setBlocGuess] = useState<Bloc | null>(null);
  const [partyGuess, setPartyGuess] = useState<Party | null>(null);
  const [lastResult, setLastResult] = useState<Guess | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
    setBlocGuess(null);
    setPartyGuess(null);
    setLastResult(null);
    setRound("bloc");
  }, []);

  const currentDeputy = deck[currentIndex];
  const nextDeputy = deck[currentIndex + 1];
  const total = deck.length;
  const blocCorrect = guesses.filter((guess) => guess.isBlocCorrect).length;
  const partyCorrect = guesses.filter((guess) => guess.isPartyCorrect).length;

  const isComplete = currentIndex >= total;
  const accuracy = guesses.length
    ? Math.round((partyCorrect / guesses.length) * 100)
    : 0;

  const actualParty = currentDeputy?.party as Party;
  const actualBloc = actualParty ? getBlocForParty(actualParty) : null;

  const partySwipeOptions = useMemo(() => {
    const options = blocGuess ? partiesByBloc[blocGuess] : [];
    if (!options.length) return [];
    return options.map((p) => ({
      id: p,
      label: partyMeta[p].label,
      color: partyMeta[p].color,
    }));
  }, [blocGuess]);

  const blocSwipeOptions = useMemo(() => [
    { id: "right", label: "DIR", color: "#10B981" },
    { id: "left", label: "ESQ", color: "#F43F5E" },
  ], []);

  const handleBlocSelect = (bloc: Bloc) => {
    if (round !== "bloc") return;
    setBlocGuess(bloc);
    setRound("party");
  };

  const handlePartySelect = (party: Party) => {
    if (round !== "party" || !blocGuess || !currentDeputy || !actualBloc || !actualParty) return;
    setPartyGuess(party);
    const result: Guess = {
      id: currentDeputy.id,
      name: currentDeputy.name,
      party: actualParty,
      bloc: actualBloc,
      blocGuess,
      partyGuess: party,
      isBlocCorrect: blocGuess === actualBloc,
      isPartyCorrect: party === actualParty,
    };
    setGuesses((prev) => [...prev, result]);
    setLastResult(result);
    setRound("reveal");
  };

  useEffect(() => {
    if (guesses.length === 0) return;
    localStorage.setItem("deputadosGuessResults", JSON.stringify(guesses));
  }, [guesses]);

  useEffect(() => {
    if (round === "reveal") {
      const timer = setTimeout(() => {
        handleNext();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [round, handleNext]);

  if (isComplete) {
    return (
      <div className="min-h-screen bg-zinc-50 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-lg shadow-zinc-200/40">
          <h1 className="text-3xl font-semibold text-zinc-950">
            Jogo terminado
          </h1>
          <p className="mt-3 text-zinc-500">
            Fizeste {partyCorrect} acertos em {guesses.length} tentativas.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-zinc-600">
            <span className="rounded-full border border-zinc-200 px-3 py-1">
              Bloco certo: {blocCorrect}/{guesses.length}
            </span>
            <span className="rounded-full border border-zinc-200 px-3 py-1">
              Partido certo: {partyCorrect}/{guesses.length}
            </span>
            <span className="rounded-full border border-zinc-200 px-3 py-1">
              Precisao: {accuracy}%
            </span>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white"
              onClick={() => window.location.reload()}
            >
              Jogar outra vez
            </button>
            <Link
              href="/insights"
              className="rounded-full border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700"
            >
              Ver insights
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!currentDeputy) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-[#F0F2F5] text-zinc-900 font-sans overflow-hidden">
      <header className="shrink-0 mx-auto flex w-full max-w-lg flex-col items-center px-6 pt-8 pb-4 relative">
        <h1 className="text-3xl font-black tracking-tighter text-[#1A1A1B] uppercase italic">
          Deputavas
        </h1>
        <div className="mt-1 flex gap-4 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">
          <span className="flex items-center gap-1">
            Score: <span className="text-zinc-900">{partyCorrect}/{guesses.length || 0}</span>
          </span>
          <span className="flex items-center gap-1">
            Accuracy: <span className="text-zinc-900">{accuracy}%</span>
          </span>
        </div>
        <Link
          href="/insights"
          className="absolute right-6 top-10 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          Stats
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-12 overflow-y-auto">
        <div className="w-full max-w-[380px] flex flex-col items-center gap-8">
          <div className="relative w-full aspect-3/4">
            <SwipeCard
              deputy={currentDeputy}
              showParty={round === "reveal"}
              isCorrect={lastResult?.isPartyCorrect}
              options={round === "bloc" ? blocSwipeOptions : round === "party" ? partySwipeOptions : undefined}
              onSelect={(id) => {
                if (round === "bloc") handleBlocSelect(id as Bloc);
                else if (round === "party") handlePartySelect(id as Party);
              }}
              onSwipeLeft={() => handleBlocSelect("left")}
              onSwipeRight={() => handleBlocSelect("right")}
              disabled={round === "reveal"}
            />
          </div>

          <div className="w-full flex flex-col items-center shrink-0">
            {round === "bloc" && (
              <div className="flex flex-col items-center w-full">
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-400 mb-6">
                  Desliza para adivinhar o bloco
                </p>
              </div>
            )}

            {round === "party" && (
              <div className="flex flex-col items-center w-full">
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-400 mb-6">
                  Desliza para adivinhar o partido
                </p>
              </div>
            )}

            {round === "reveal" && (
              <div className="flex flex-col items-center gap-8 w-full animate-in fade-in zoom-in-95 duration-500">
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full max-w-[280px] rounded-4xl bg-[#1A1A1B] py-4 text-[9px] font-black uppercase tracking-[0.3em] text-white shadow-2xl transition-all active:scale-95 hover:bg-zinc-800 flex items-center justify-center gap-2"
                >
                  Próximo Deputado
                  <span className="text-base">→</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {isComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
          <div className="w-full max-w-sm rounded-[2.5rem] bg-white p-10 text-center shadow-2xl">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-[#1A1A1B]">
              Fim de Jogo
            </h2>
            <div className="mt-8 space-y-4">
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Score</span>
                <span className="text-lg font-black">{partyCorrect}/{guesses.length}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Precisão</span>
                <span className="text-lg font-black">{accuracy}%</span>
              </div>
            </div>
            <div className="mt-10 flex flex-col gap-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full rounded-2xl bg-[#1A1A1B] py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all active:scale-95"
              >
                Jogar de Novo
              </button>
              <button className="w-full rounded-2xl border-2 border-zinc-200 py-4 text-xs font-black uppercase tracking-[0.2em] text-zinc-600 transition-all active:scale-95">
                Partilhar Resultados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
