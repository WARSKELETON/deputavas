"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { usePostHog } from "posthog-js/react";

import deputados from "@/src/data/deputados.json";
import projetosLei from "@/src/data/projetos-lei.json";
import { partyMeta, type Bloc, type Party } from "@/src/data/parties";
import SwipeCard from "@/src/components/SwipeCard";
import { useGame, type Guess } from "@/src/context/GameContext";
import { encodeGuesses } from "@/src/utils/encoding";
import AdBanner from "@/src/components/AdBanner";
import { clearGameState } from "@/src/utils/gameStorage";

type Deputy = {
  type: "deputy";
  id: string;
  name: string;
  party: string;
  legislature: string;
  photoUrl: string;
};

type ProjetoLei = {
  type: "project";
  id: string;
  name: string;
  projectType: string;
  number: string;
  legislature: string;
  session: string;
  party: Party;
  title: string;
};

type GameCard = Deputy | ProjetoLei;

const PROJECT_CARD_INTERVAL = 3;

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

function isParty(value: string): value is Party {
  return value in partyMeta;
}

function buildDeck(deputyItems: Deputy[], projectItems: ProjetoLei[]) {
  const deck: GameCard[] = [];
  let projectIndex = 0;

  for (let i = 0; i < deputyItems.length; i += 1) {
    deck.push(deputyItems[i]);
    const shouldInsertProject = (i + 1) % PROJECT_CARD_INTERVAL === 0;
    if (shouldInsertProject && projectIndex < projectItems.length) {
      deck.push(projectItems[projectIndex]);
      projectIndex += 1;
    }
  }

  return deck;
}

const GAME_STATE_STORAGE_KEY = "deputavasGameState";

type GameState = {
  clientSeed: number;
  currentIndex: number;
  round: "bloc" | "party" | "reveal";
  blocGuess: Bloc | null;
  lastResult: Guess | null;
  showAdBreak: boolean;
};

function loadGameState(): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GAME_STATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GameState>;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.clientSeed !== "number" ||
      typeof parsed.currentIndex !== "number" ||
      typeof parsed.round !== "string"
    ) {
      return null;
    }
    return {
      clientSeed: parsed.clientSeed,
      currentIndex: parsed.currentIndex,
      round: parsed.round as "bloc" | "party" | "reveal",
      blocGuess: parsed.blocGuess ?? null,
      lastResult: parsed.lastResult ?? null,
      showAdBreak: parsed.showAdBreak ?? false,
    };
  } catch {
    return null;
  }
}

function saveGameState(state: GameState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GAME_STATE_STORAGE_KEY, JSON.stringify(state));
}

export default function Home() {
  const router = useRouter();
  const posthog = usePostHog();
  const { guesses, projectGuesses, addGuess, addProjectGuess, clearGuesses } = useGame();

  // State initialization with defaults for SSR
  const [clientSeed, setClientSeed] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [round, setRound] = useState<"bloc" | "party" | "reveal">("bloc");
  const [blocGuess, setBlocGuess] = useState<Bloc | null>(null);
  const [lastResult, setLastResult] = useState<Guess | null>(null);
  const [showAdBreak, setShowAdBreak] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load saved state or create new game on mount
  useEffect(() => {
    const savedState = loadGameState();
    if (savedState) {
      setClientSeed(savedState.clientSeed);
      setCurrentIndex(savedState.currentIndex);
      setRound(savedState.round);
      setBlocGuess(savedState.blocGuess);
      setLastResult(savedState.lastResult);
      setShowAdBreak(savedState.showAdBreak);
    } else {
      setClientSeed(Math.floor(Math.random() * 1000000));
    }
    setIsHydrated(true);
  }, []);

  // Capture analytics for new game (only on mount, when there are no saved guesses)
  useEffect(() => {
    if (isHydrated && guesses.length === 0) {
      const savedState = loadGameState();
      if (!savedState) {
        posthog.capture('game_started');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  const deck = useMemo(() => {
    const seed = clientSeed ?? 0;
    const deputyDeck = shuffleWithSeed(
      (deputados as Omit<Deputy, "type">[]).map((deputy) => ({
        ...deputy,
        type: "deputy" as const,
      })),
      seed
    );

    const filteredProjects = (projetosLei as Array<{
      id: string;
      type: string;
      number: string;
      legislature: string;
      session: string;
      party: string;
      title: string;
    }>).filter((project) => isParty(project.party));

    const projectDeck = shuffleWithSeed(
      filteredProjects.map((project) => ({
        type: "project" as const,
        id: project.id,
        name: project.number,
        projectType: project.type,
        number: project.number,
        legislature: project.legislature,
        session: project.session,
        party: project.party as Party,
        title: project.title,
      })),
      seed + 997
    );

    return buildDeck(deputyDeck, projectDeck);
  }, [clientSeed]);

  const currentCard = deck[currentIndex];
  const total = deck.length;

  // Save game state whenever it changes
  useEffect(() => {
    if (clientSeed === null) return;
    saveGameState({
      clientSeed,
      currentIndex,
      round,
      blocGuess,
      lastResult,
      showAdBreak,
    });
  }, [clientSeed, currentIndex, round, blocGuess, lastResult, showAdBreak]);

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    // Show ad break after 3 cards, then every 5 cards after that
    const shouldShowAd = nextIndex === 3 || (nextIndex > 3 && (nextIndex - 3) % 5 === 0);
    if (shouldShowAd && nextIndex < total) {
      setShowAdBreak(true);
      posthog.capture('ad_break_shown', { index: nextIndex });
    }
    setCurrentIndex(nextIndex);
    setBlocGuess(null);
    setLastResult(null);
    setRound("bloc");
  }, [currentIndex, total, posthog]);
  const blocCorrect = guesses.filter((guess) => guess.isBlocCorrect).length;
  const partyCorrect = guesses.filter((guess) => guess.isPartyCorrect).length;

  const isComplete = currentIndex >= total;
  const accuracy = guesses.length
    ? Math.round((partyCorrect / guesses.length) * 100)
    : 0;

  const actualParty = currentCard?.party as Party | undefined;
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
        { id: "left", label: "ESQ", color: "#FF2157" },
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
    if (round !== "bloc" || !currentCard) return;
    posthog.capture('bloc_guessed', {
      bloc,
      card_type: currentCard.type,
      card_id: currentCard.id,
      card_name: currentCard.name
    });
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
    if (round !== "party" || !blocGuess || !currentCard || !actualBloc || !actualParty) return;
    const isBlocCorrect = blocGuess === actualBloc;
    const isPartyCorrect = party === actualParty;

    posthog.capture('party_guessed', {
      party_guess: party,
      party_actual: actualParty,
      bloc_guess: blocGuess,
      bloc_actual: actualBloc,
      is_bloc_correct: isBlocCorrect,
      is_party_correct: isPartyCorrect,
      card_type: currentCard.type,
      card_id: currentCard.id,
      card_name: currentCard.type === "project" ? currentCard.number : currentCard.name
    });

    const result: Guess = {
      id: currentCard.id,
      name: currentCard.type === "project" ? currentCard.number : currentCard.name,
      type: currentCard.type,
      party: actualParty,
      bloc: actualBloc,
      blocGuess,
      partyGuess: party,
      isBlocCorrect,
      isPartyCorrect,
    };
    if (currentCard.type === "deputy") addGuess(result);
    else addProjectGuess(result);
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

  useEffect(() => {
    if (isComplete) {
      posthog.capture('game_completed', {
        total_guesses: guesses.length,
        party_correct: partyCorrect,
        bloc_correct: blocCorrect,
        accuracy
      });
      // Clear saved game state when game is completed
      clearGameState();
    }
  }, [isComplete, posthog, guesses.length, partyCorrect, blocCorrect, accuracy]);


  const buildShareUrl = useCallback(() => {
    if (typeof window === "undefined") return "";
    const url = new URL("/share", window.location.origin);
    url.searchParams.set("score", String(partyCorrect));
    url.searchParams.set("total", String(guesses.length));
    url.searchParams.set("accuracy", String(accuracy));
    if (guesses.length > 0) {
      url.searchParams.set("g", encodeGuesses(guesses));
    }
    if (projectGuesses.length > 0) {
      url.searchParams.set("pg", encodeGuesses(projectGuesses));
    }
    return url.toString();
  }, [partyCorrect, guesses, projectGuesses, accuracy]);

  const handleShareResults = useCallback(() => {
    const shareUrl = buildShareUrl();
    if (!shareUrl) return;
    posthog.capture("share_results_clicked", {
      score: partyCorrect,
      total: guesses.length,
      accuracy,
    });
    router.push(shareUrl);
  }, [buildShareUrl, posthog, partyCorrect, guesses.length, accuracy, router]);

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
              Precisão: {accuracy}%
            </span>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white"
              onClick={() => {
                posthog.capture('play_again_clicked', { location: 'completion_card' });
                clearGameState();
                clearGuesses();
                window.location.reload();
              }}
            >
              Jogar outra vez
            </button>
            <Link
              href="/insights"
              onClick={() => posthog.capture('view_insights_clicked', { location: 'completion_card' })}
              className="rounded-full border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700"
            >
              Ver insights
            </Link>
            <button
              onClick={handleShareResults}
              className="rounded-full border-2 px-6 py-3 text-base font-bold text-zinc-900 animate-pulsate-party transition-all active:scale-95"
            >
              Partilhar resultados
            </button>
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

  if (!currentCard) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-[#F0F2F5] text-zinc-900 font-sans overflow-y-auto overflow-x-hidden">
      <header className="shrink-0 mx-auto flex w-full max-w-lg flex-col items-center px-6 pt-4 pb-2 sticky top-0 z-0 bg-[#F0F2F5]/80 backdrop-blur-md">
        <h1 className="text-3xl font-black tracking-tighter text-[#1A1A1B] uppercase italic">
          Deputavas?
        </h1>
        <div className="mt-1 flex gap-4 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">
          <span className="flex items-center gap-1">
            Pontos: <span className="text-zinc-900">{partyCorrect}/{guesses.length || 0}</span>
          </span>
          <span className="flex items-center gap-1">
            Precisão: <span className="text-zinc-900">{accuracy}%</span>
          </span>
        </div>
        <Link
          href="/insights"
          onClick={() => posthog.capture('view_insights_clicked', { location: 'header' })}
          className="flex items-center border rounded-4xl py-1 px-2 gap-1 mt-4 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          Estatísticas
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
          </svg>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-12 relative z-10">
        <div className="w-full max-w-[380px] flex flex-col items-center gap-6">
          <div className="relative w-full aspect-3/4">
            <SwipeCard
              card={currentCard}
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

          {round === "reveal" && (<div className="w-full flex flex-col items-center shrink-0">
            <div className="flex flex-col items-center gap-8 w-full animate-in fade-in zoom-in-95 duration-500">
              <button
                type="button"
                onClick={handleNext}
                className="w-full max-w-[280px] rounded-4xl bg-[#1A1A1B] py-4 text-[9px] font-black uppercase tracking-[0.3em] text-white shadow-2xl transition-all active:scale-95 hover:bg-zinc-800 flex items-center justify-center gap-2"
              >
                Próxima Carta
                <span className="text-base">→</span>
              </button>
            </div>
          </div>)}

          {guesses.length >= 2 && (
            <button
              type="button"
              onClick={handleShareResults}
              className="w-full max-w-[280px] rounded-4xl border-2 py-4 text-xs font-black uppercase tracking-[0.3em] text-zinc-900 animate-pulsate-party transition-all active:scale-95"
            >
              Deputa um amigo teu
            </button>
          )}

          <section className="w-full max-w-[380px] rounded-3xl border border-zinc-200 bg-white/80 p-6 text-center shadow-md shadow-zinc-200/40">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
              Sobre o Deputavas
            </h2>
            <p className="mt-3 text-sm text-zinc-700">
              Somos dois jovens portugueses a tentar tornar a política mais acessível e
              divertida. O Deputavas é um jogo educativo para conheceres os partidos de forma leve e rápida.
            </p>
            <p className="mt-3 text-xs text-zinc-500">
              Projeto independente, sem afiliação partidária.
            </p>
            <a
              href="https://buymeacoffee.com/deputavas"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center justify-center rounded-2xl bg-[#1A1A1B] px-5 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-white transition-all hover:bg-zinc-800 active:scale-95"
            >
              Oferece-nos um café
            </a>
          </section>
        </div>
      </main>

      {/* Ad break interstitial - every 5 guesses */}
      {/* {showAdBreak && process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-6">
          <div className="w-full max-w-sm rounded-4xl bg-white p-8 text-center shadow-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-4">
              Pausa para reclame
            </p>
            <div className="my-4">
              <AdBanner adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID!} adFormat="rectangle" />
            </div>
            <button
              onClick={() => {
                posthog.capture('ad_break_continued');
                setShowAdBreak(false);
              }}
              className="mt-4 w-full rounded-2xl bg-[#1A1A1B] py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all active:scale-95"
            >
              Continuar a jogar
            </button>
          </div>
        </div>
      )} */}

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
                onClick={() => {
                  posthog.capture('play_again_clicked', { location: 'completion_modal' });
                  clearGameState();
                  clearGuesses();
                  window.location.reload();
                }}
                className="w-full rounded-2xl bg-[#1A1A1B] py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all active:scale-95"
              >
                Jogar de Novo
              </button>
              <button
                onClick={handleShareResults}
                className="w-full rounded-2xl border-2 py-4 text-xs font-black uppercase tracking-[0.2em] text-zinc-900 animate-pulsate-party transition-all active:scale-95"
              >
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
