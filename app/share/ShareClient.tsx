"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import ShareActions from "./ShareActions";
import { partyMeta, type Party } from "@/src/data/parties";
import { useGame, type Guess } from "@/src/context/GameContext";
import { decodeGuesses } from "@/src/utils/encoding";
import deputadosData from "@/src/data/deputados.json";

function parseNumber(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function ParliamentChart({ guesses }: { guesses: Guess[] }) {
  const sortedDeputados = useMemo(() => {
    const partyOrder: Party[] = [
      "BE",
      "PCP",
      "L",
      "PS",
      "JPP",
      "PAN",
      "PSD",
      "CDS-PP",
      "IL",
      "CH",
    ];
    return [...deputadosData].sort((a, b) => {
      const indexA = partyOrder.indexOf(a.party as Party);
      const indexB = partyOrder.indexOf(b.party as Party);
      return indexA - indexB;
    });
  }, []);

  const rows = useMemo(() => [
    { radius: 80, count: 30 },
    { radius: 105, count: 38 },
    { radius: 130, count: 46 },
    { radius: 155, count: 53 },
    { radius: 180, count: 62 },
  ], []);

  const seats = useMemo(() => {
    const allPossibleSeats: { x: number; y: number; rotation: number; theta: number }[] = [];
    
    for (const row of rows) {
      for (let i = 0; i < row.count; i++) {
        const angle = (i / (row.count - 1)) * Math.PI;
        const theta = Math.PI - angle;
        
        const x = row.radius * Math.cos(theta);
        const y = -row.radius * Math.sin(theta);
        const rotation = (theta * 180) / Math.PI + 90;
        
        allPossibleSeats.push({
          x,
          y,
          rotation,
          theta,
        });
      }
    }

    allPossibleSeats.sort((a, b) => b.theta - a.theta);

    return allPossibleSeats.map((seat, i) => {
      const deputado = sortedDeputados[i];
      const guess = deputado ? guesses.find(g => g.id === deputado.id) : undefined;
      return {
        ...seat,
        deputado,
        guess
      };
    }).filter(s => s.deputado);
  }, [sortedDeputados, guesses, rows]);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full aspect-2/1 max-w-sm mx-auto mt-4">
        <svg viewBox="-205 -205 410 215" className="w-full h-full overflow-visible">
          {seats.map((seat, i) => {
            const isGuessed = !!seat.guess;
            const isCorrect = seat.guess?.isPartyCorrect;
            const party = seat.deputado?.party as Party;
            const color = partyMeta[party]?.color || "#cbd5e1";
            
            let fillColor = "#cbd5e1"; // zinc-300
            if (isGuessed) {
              fillColor = color;
            }

            return (
              <g key={i} transform={`translate(${seat.x}, ${seat.y}) rotate(${seat.rotation})`}>
                <rect
                  x="-5"
                  y="-4"
                  width="10"
                  height="7"
                  fill={fillColor}
                  rx="1"
                  className="transition-all duration-500"
                  style={{
                    opacity: isGuessed ? 1 : 0.3,
                  }}
                />
                {isGuessed && !isCorrect && (
                  <circle r="1.5" fill="white" className="animate-pulse" />
                )}
              </g>
            );
          })}
          
          <text
            x="0"
            y="-20"
            textAnchor="middle"
            className="fill-zinc-900 text-5xl font-black tracking-tighter"
          >
            {guesses.length}
          </text>
          <text
            x="0"
            y="10"
            textAnchor="middle"
            className="fill-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]"
          >
            Jogadas
          </text>
        </svg>
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-x-1 gap-y-3 w-full">
        {(() => {
          const displayParties: { label: string; color: string; count: number }[] = [];
          
          // Count plays per party from guesses
          const beCount = guesses.filter(g => g.party === "BE").length;
          if (beCount) displayParties.push({ label: "BE", color: partyMeta.BE.color, count: beCount });
          
          const cduCount = guesses.filter(g => g.party === "PCP").length;
          if (cduCount) displayParties.push({ label: "CDU", color: partyMeta.PCP.color, count: cduCount });
          
          const lCount = guesses.filter(g => g.party === "L").length;
          if (lCount) displayParties.push({ label: "L", color: partyMeta.L.color, count: lCount });
          
          const psCount = guesses.filter(g => g.party === "PS").length;
          if (psCount) displayParties.push({ label: "PS", color: partyMeta.PS.color, count: psCount });
          
          const jppCount = guesses.filter(g => g.party === "JPP").length;
          if (jppCount) displayParties.push({ label: "JPP", color: partyMeta.JPP.color, count: jppCount });
          
          const panCount = guesses.filter(g => g.party === "PAN").length;
          if (panCount) displayParties.push({ label: "PAN", color: partyMeta.PAN.color, count: panCount });
          
          const adCount = guesses.filter(g => g.party === "PSD" || g.party === "CDS-PP").length;
          if (adCount) displayParties.push({ label: "AD", color: partyMeta.PSD.color, count: adCount });
          
          const ilCount = guesses.filter(g => g.party === "IL").length;
          if (ilCount) displayParties.push({ label: "IL", color: partyMeta.IL.color, count: ilCount });
          
          const chCount = guesses.filter(g => g.party === "CH").length;
          if (chCount) displayParties.push({ label: "CH", color: partyMeta.CH.color, count: chCount });

          return displayParties.map(p => (
            <div key={p.label} className="flex flex-col items-center gap-1.5 min-w-[42px]">
              <div 
                className="px-2 py-1 rounded-sm text-[9px] font-black text-white shadow-sm"
                style={{ backgroundColor: p.color }}
              >
                {p.label}
              </div>
              <span className="text-[10px] font-black text-zinc-900">{p.count}</span>
            </div>
          ));
        })()}
      </div>
    </div>
  );
}

function QuadrantChart({ guesses }: { guesses: Guess[] }) {
  const chartData = useMemo(() => {
    const parties = Object.keys(partyMeta) as Party[];
    const rawData = parties.map(party => {
      const partyGuesses = guesses.filter(g => g.partyGuess === party);
      const correctGuesses = partyGuesses.filter(g => g.isPartyCorrect);
      const accuracy = partyGuesses.length ? (correctGuesses.length / partyGuesses.length) * 100 : 0;
      const count = partyGuesses.length;
      return {
        party,
        accuracy,
        count,
        bloc: partyMeta[party].bloc,
        color: partyMeta[party].color,
        logo: partyMeta[party].logo,
      };
    }).filter(p => p.count > 0);

    if (rawData.length === 0) return [];

    const maxCount = Math.max(...rawData.map(d => d.count), 1);
    
    // Calculate initial positions
    const points = rawData.map(d => ({
      ...d,
      x: 10 + (d.count / maxCount) * 80,
      y: 10 + (d.accuracy / 100) * 80,
    }));

    // Overlap prevention with multiple iterations for better distribution
    const RADIUS = 10; // Minimum distance between centers in percentage
    const ITERATIONS = 3;
    
    for (let iter = 0; iter < ITERATIONS; iter++) {
      for (let i = 0; i < points.length; i++) {
        for (let j = 0; j < points.length; j++) {
          if (i === j) continue;
          
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < RADIUS) {
            // Move points[i] away from points[j]
            const angle = Math.atan2(dy, dx) || (i * 0.5);
            const force = (RADIUS - distance) / 2;
            const moveX = Math.cos(angle) * (force + 0.5);
            const moveY = Math.sin(angle) * (force + 0.5);
            
            points[i].x += moveX;
            points[i].y += moveY;
            
            // Keep within bounds [8, 92] to avoid labels
            points[i].x = Math.max(8, Math.min(92, points[i].x));
            points[i].y = Math.max(8, Math.min(92, points[i].y));
          }
        }
      }
    }

    return points;
  }, [guesses]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full aspect-square max-w-[300px] border-2 border-zinc-100 rounded-3xl bg-zinc-50/50 p-6">
        {/* Axes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-6 right-6 h-px bg-zinc-200" />
          <div className="absolute left-1/2 top-6 bottom-6 w-px bg-zinc-200" />
        </div>
        
        {/* Labels */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-widest text-zinc-400">Alta Precisão</div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-widest text-zinc-400">Baixa Precisão</div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[8px] font-black uppercase tracking-widest text-zinc-400">Menos Jogadas</div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-[8px] font-black uppercase tracking-widest text-zinc-400">Mais Jogadas</div>

        {/* Dots */}
        {chartData.map((d) => {
          return (
            <div
              key={d.party}
              className="absolute w-6 h-6 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-white shadow-md flex items-center justify-center overflow-hidden bg-white transition-all duration-700 hover:scale-150 z-10"
              style={{
                left: `${d.x}%`,
                bottom: `${d.y}%`,
              }}
              title={`${d.party}: ${Math.round(d.accuracy)}% (${d.count})`}
            >
              <img 
                src={d.logo} 
                alt={d.party} 
                style={{ backgroundColor: ["IL", "JPP", "BE", "PAN"].includes(d.party) ? "#FFFFFF" : d.color }}
                className="w-full h-full object-contain p-0.5"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniCards({ guesses }: { guesses: Guess[] }) {
  const lastGuesses = useMemo(() => guesses.slice(-4).reverse(), [guesses]);

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {lastGuesses.map((guess, i) => {
        const deputy = deputadosData.find(d => d.id === guess.id);
        return (
          <div key={guess.id + i} style={{ backgroundColor: partyMeta[guess.partyGuess]?.color }} className={`relative aspect-3/4 rounded-2xl overflow-hidden border-4 shadow-sm ${guess.isPartyCorrect ? 'border-emerald-500' : 'border-rose-500'}`}>
            {deputy && (
              <img 
                src={deputy.photoUrl} 
                alt={deputy.name}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-[8px] font-black text-white truncate uppercase tracking-tighter">
                {guess.name}
              </p>
              <div className="flex items-center justify-between">
                <div className="mt-1 flex items-center gap-1">
                  <div 
                    className={`px-1.5 py-0.5 rounded-[4px] text-[6px] font-black text-white ${guess.isPartyCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  >
                    {guess.partyGuess}
                  </div>
                  {!guess.isPartyCorrect && (
                    <div className="px-1.5 py-0.5 rounded-[4px] text-[6px] font-black bg-white text-zinc-900">
                      {guess.party}
                    </div>
                  )}
                </div>
                <img src={partyMeta[guess.partyGuess].logo} alt={guess.partyGuess} className="w-6 h-6 object-contain" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ShareClient() {
  const searchParams = useSearchParams();
  const hasUtmParamsSet = useMemo(() => {
    return searchParams.get("utm_source") !== null && searchParams.get("utm_medium") !== null && searchParams.get("utm_campaign") !== null && searchParams.get("ref") !== null;
  }, [searchParams]);
  const { guesses: contextGuesses } = useGame();
  
  const score = parseNumber(searchParams.get("score"));
  const total = parseNumber(searchParams.get("total"));
  const accuracy = parseNumber(searchParams.get("accuracy"));
  
  // Use context guesses if available, otherwise try to reconstruct from total/score (partial)
  // Ideally we should encode guesses in URL, but for now we prioritize context
  const hasScore = score !== null && total !== null;
  const computedAccuracy = accuracy ?? (score !== null && total ? (score / total) * 100 : null);
  const accuracyValue = Math.min(100, Math.max(0, Math.round(computedAccuracy ?? 0)));

  const displayGuesses = useMemo(() => {
    const urlGuesses = decodeGuesses(searchParams.get("g"));
    if (urlGuesses.length > 0) return urlGuesses;
    if (contextGuesses.length > 0) return contextGuesses;
    return [];
  }, [contextGuesses, searchParams]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    url.searchParams.set("utm_source", "share");
    url.searchParams.set("utm_medium", "game");
    url.searchParams.set("utm_campaign", "deputavas");
    url.searchParams.set("ref", "results");
    return url.toString();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F0F2F5] px-6 py-12 text-zinc-900 font-sans">
      <div className="pointer-events-none absolute -top-32 right-[-140px] h-72 w-72 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-[-120px] h-72 w-72 rounded-full blur-3xl" />
      
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 relative z-10">
        <header className="text-center">
          <Link href="/" className="text-[12px] font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-zinc-600 transition-colors">
            ← Deputavas?
          </Link>
          <h1 className="mt-4 text-4xl font-black tracking-tighter text-[#1A1A1B] uppercase italic">
            {hasUtmParamsSet ? "O teu amigo Deputou" : "Partilha o que Deputaste"}
          </h1>
          <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-zinc-600">Tu Deputas?</h2>
        </header>

        <main className="grid gap-6 lg:grid-cols-2">
          {/* Left Column: Visual Insights */}
          <div className="flex flex-col gap-6">
            {!hasUtmParamsSet && (
              <section className="rounded-[2.5rem] border border-zinc-100 bg-white p-8 shadow-xl shadow-zinc-200/50">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">
                  Partilha o teu resultado
                </h2>
                <div className="mt-6">
                  <ShareActions
                    shareUrl={shareUrl}
                    title="Deputavas?"
                    text={hasScore ? `Deputei ${score} em ${total}! (${accuracyValue}% de precisão). Tu Deputavas?` : "Vê o meu resultado no Deputavas."}
                  />
                </div>
              </section>
            )}
            <section className="rounded-[2.5rem] border border-zinc-100 bg-white p-8 shadow-xl shadow-zinc-200/50">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6">
                O Parlamento da Partida
              </h2>
              <ParliamentChart guesses={displayGuesses} />
            </section>

            {hasUtmParamsSet && (
              <Link
                href="/"
                className="rounded-[2.5rem] bg-[#1A1A1B] p-8 text-white shadow-2xl transition-transform active:scale-[0.98] group border-4 animate-pulsate-party"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/70">Desafio</p>
                    <p className="mt-2 text-xl font-black">Consegues Deputar melhor?</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-[#1A1A1B] group-hover:translate-x-1 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center flex-wrap gap-4 pt-4">
                {Object.values(partyMeta).map(p => (
                    <div key={p.label} className="h-6 w-6 rounded-full flex items-center justify-center text-[#1A1A1B] group-hover:translate-x-1 transition-transform">
                      <img src={p.logo} alt={p.label} className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
              </Link>
            )}
          </div>

          {/* Right Column: Cards & Matrix */}
          <div className="flex flex-col gap-6">
            <section className="rounded-[2.5rem] border border-zinc-100 bg-white p-8 shadow-xl shadow-zinc-200/50">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6">
                As suas últimas Deputagens
              </h2>
              <MiniCards guesses={displayGuesses} />
            </section>

            <section className="rounded-[2.5rem] border border-zinc-100 bg-white p-8 shadow-xl shadow-zinc-200/50">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6">
                Matriz de Precisão por Partido
              </h2>
              <QuadrantChart guesses={displayGuesses} />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
