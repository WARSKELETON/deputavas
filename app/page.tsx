"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";

import deputados from "@/src/data/deputados.json";
import { partyMeta, type Bloc, type Party } from "@/src/data/parties";
import SwipeCard from "@/src/components/SwipeCard";
import { useGame, type Guess } from "@/src/context/GameContext";
import AdBanner from "@/src/components/AdBanner";

type Deputy = {
  id: string;
  name: string;
  party: string;
  legislature: string;
  photoUrl: string;
};

function seededRandom(seed: number) {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function shuffleWithSeed<T>(items: T[], seed: number) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getBlocForParty(party: Party) {
  return partyMeta[party]?.bloc ?? "left";
}

export default function Home() {
  const { guesses, addGuess } = useGame();
  const [clientSeed, setClientSeed] = useState<number | null>(null);
  
  useEffect(() => {
    // Initialize random seed once on client mount to avoid hydration mismatch
    // This one-time initialization is intentional and necessary
    // eslint-disable-next-line
    setClientSeed(Math.floor(Math.random() * 1000000));
  }, []);
  
  const deck = useMemo(() => {
    const seed = clientSeed ?? 0;
    return shuffleWithSeed(deputados as Deputy[], seed);
  }, [clientSeed]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [round, setRound] = useState<"bloc" | "party" | "reveal">("bloc");
  const [blocGuess, setBlocGuess] = useState<Bloc | null>(null);
  const [lastResult, setLastResult] = useState<Guess | null>(null);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
    setBlocGuess(null);
    setLastResult(null);
    setRound("bloc");
  }, []);

  const currentDeputy = deck[currentIndex];
  const total = deck.length;
  const blocCorrect = guesses.filter((guess) => guess.isBlocCorrect).length;
  const partyCorrect = guesses.filter((guess) => guess.isPartyCorrect).length;

  const isComplete = currentIndex >= total;
  const accuracy = guesses.length
    ? Math.round((partyCorrect / guesses.length) * 100)
    : 0;

  const actualParty = currentDeputy?.party as Party;
  const actualBloc = actualParty ? getBlocForParty(actualParty) : null;

  const allPartyOptions = useMemo(() => [
    { id: "PSD", label: "PSD", color: partyMeta["PSD"].color, bloc: "right" },
    { id: "CDS-PP", label: "CDS", color: partyMeta["CDS-PP"].color, bloc: "right" },
    { id: "IL", label: "IL", color: partyMeta["IL"].color, bloc: "right" },
    { id: "CH", label: "CH", color: partyMeta["CH"].color, bloc: "right" },
    { id: "JPP", label: "JPP", color: partyMeta["JPP"].color, bloc: "left" },
    { id: "L", label: "L", color: partyMeta["L"].color, bloc: "left" },
    { id: "PCP", label: "PCP", color: partyMeta["PCP"].color, bloc: "left" },
    { id: "BE", label: "BE", color: partyMeta["BE"].color, bloc: "left" },
    { id: "PS", label: "PS", color: partyMeta["PS"].color, bloc: "left" },
    { id: "PAN", label: "PAN", color: partyMeta["PAN"].color, bloc: "left" },
  ], []);

  const currentOptions = useMemo(() => {
    if (round === "bloc") {
      return [
        { id: "right", label: "DIR", color: partyMeta["PSD"].color },
        { id: "left", label: "ESQ", color: partyMeta["PS"].color },
      ];
    }
    
    // In party or reveal round, show only parties from the selected bloc
    const effectiveBloc = blocGuess || lastResult?.blocGuess;
    if (round === "party" && effectiveBloc) {
      return allPartyOptions
        .filter(opt => opt.bloc === effectiveBloc)
        .map(opt => ({ ...opt, opacity: 0.6 }));
    }
    
    // In reveal, show all parties
    return allPartyOptions.map(opt => ({ ...opt, opacity: 0.6 }));
  }, [round, blocGuess, lastResult, allPartyOptions]);

  const handleBlocSelect = (bloc: Bloc) => {
    if (round !== "bloc") return;
    setBlocGuess(bloc);
    setRound("party");
  };

  const persistentSelections = useMemo(() => {
    const selections = [];
    if (blocGuess || lastResult?.blocGuess) {
      const b = blocGuess || lastResult?.blocGuess;
      selections.push({
        id: b!,
        label: b === "left" ? "ESQ" : "DIR",
        color: b === "left" ? partyMeta["PS"].color : partyMeta["PSD"].color,
      });
    }
    if (lastResult?.partyGuess) {
      selections.push({
        id: lastResult.partyGuess,
        label: partyMeta[lastResult.partyGuess].label,
        color: partyMeta[lastResult.partyGuess].color,
      });
    }
    return selections;
  }, [blocGuess, lastResult]);

  const handlePartySelect = (party: Party) => {
    if (round !== "party" || !blocGuess || !currentDeputy || !actualBloc || !actualParty) return;
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
    addGuess(result);
    setLastResult(result);
    setRound("reveal");
  };

  useEffect(() => {
    if (round === "reveal") {
      const timer = setTimeout(() => {
        handleNext();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [round, handleNext]);

  if (clientSeed === null) {
    return null;
  }

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
          
          {/* Ad placement - shows after game completion */}
          {process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID && (
            <div className="mt-10 w-full max-w-md">
              <AdBanner adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID!} adFormat="horizontal" />
            </div>
          )}
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
          Deputavas?
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
              options={currentOptions}
              persistentSelections={persistentSelections}
              onSelect={(id) => {
                if (round === "bloc") handleBlocSelect(id as Bloc);
                else if (round === "party") handlePartySelect(id as Party);
              }}
              selectionOverlay={(option) => (
                <div 
                  className="scale-90 rounded-xl px-6 py-3 shadow-2xl border-2 border-white animate-in zoom-in-95 duration-200 flex flex-col items-center"
                  style={{ backgroundColor: option.color }}
                >
                  <span className="text-2xl font-black italic text-white uppercase tracking-tighter">
                    {option.label}
                  </span>
                  {round === "bloc" && (
                    <span className="text-[8px] font-bold text-white/80 uppercase tracking-[0.2em] mt-0.5">
                      {option.id === "left" ? "Esquerda" : "Direita"}
                    </span>
                  )}
                </div>
              )}
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
            
            {/* Ad in modal */}
            {process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID && (
              <div className="mt-6">
                <AdBanner adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID!} adFormat="rectangle" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
