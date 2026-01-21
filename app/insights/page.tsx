"use client";

import Link from "next/link";
import { useMemo } from "react";

import { partyMeta, type Party } from "@/src/data/parties";
import { useGame, type Guess } from "@/src/context/GameContext";
import deputadosData from "@/src/data/deputados.json";

function AccuracyCircle({ percent }: { percent: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center h-48 w-48">
      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-zinc-100"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="text-zinc-900 transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-5xl font-black tracking-tighter">{Math.round(percent)}%</span>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mt-1">
          Precisão
        </span>
      </div>
    </div>
  );
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
    // 1. Generate all possible seat positions
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

    // 2. Sort all seats by angle (theta) from left to right
    // Leftmost theta is PI (180deg), rightmost is 0 (0deg)
    // So sorting descending by theta gives left-to-right
    allPossibleSeats.sort((a, b) => b.theta - a.theta);

    // 3. Map sorted deputies to sorted seats
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
            {sortedDeputados.length}
          </text>
          <text
            x="0"
            y="10"
            textAnchor="middle"
            className="fill-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]"
          >
            Deputados
          </text>
        </svg>
      </div>
      
      <div className="mt-12 flex flex-wrap justify-center gap-x-1 gap-y-3 w-full">
        {(() => {
          const displayParties: { label: string; color: string; count: number }[] = [];
          
          // Group BE
          const beCount = sortedDeputados.filter(d => d.party === "BE").length;
          if (beCount) displayParties.push({ label: "BE", color: partyMeta.BE.color, count: beCount });
          
          // Group CDU (PCP)
          const cduCount = sortedDeputados.filter(d => d.party === "PCP").length;
          if (cduCount) displayParties.push({ label: "CDU", color: partyMeta.PCP.color, count: cduCount });
          
          // Group L
          const lCount = sortedDeputados.filter(d => d.party === "L").length;
          if (lCount) displayParties.push({ label: "L", color: partyMeta.L.color, count: lCount });
          
          // Group PS
          const psCount = sortedDeputados.filter(d => d.party === "PS").length;
          if (psCount) displayParties.push({ label: "PS", color: partyMeta.PS.color, count: psCount });
          
          // Group JPP
          const jppCount = sortedDeputados.filter(d => d.party === "JPP").length;
          if (jppCount) displayParties.push({ label: "JPP", color: partyMeta.JPP.color, count: jppCount });
          
          // Group PAN
          const panCount = sortedDeputados.filter(d => d.party === "PAN").length;
          if (panCount) displayParties.push({ label: "PAN", color: partyMeta.PAN.color, count: panCount });
          
          // Group AD (PSD + CDS-PP)
          const adCount = sortedDeputados.filter(d => d.party === "PSD" || d.party === "CDS-PP").length;
          if (adCount) displayParties.push({ label: "AD", color: partyMeta.PSD.color, count: adCount });
          
          // Group IL
          const ilCount = sortedDeputados.filter(d => d.party === "IL").length;
          if (ilCount) displayParties.push({ label: "IL", color: partyMeta.IL.color, count: ilCount });
          
          // Group CH
          const chCount = sortedDeputados.filter(d => d.party === "CH").length;
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

function ProgressBar({
  label,
  percent,
  colorClass,
}: {
  label: string;
  percent: number;
  colorClass: string;
}) {
  return (
    <div className="w-full">
      <div className="mb-3 flex justify-between items-end">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
          {label}
        </span>
        <span className="text-sm font-black">{Math.round(percent)}%</span>
      </div>
      <div className="h-4 w-full rounded-full bg-zinc-100 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-out ${colorClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function SegmentedBar({
  leftLabel,
  rightLabel,
  leftPercent,
  rightPercent,
  leftColor,
  rightColor,
  caption,
}: {
  leftLabel: string;
  rightLabel: string;
  leftPercent: number;
  rightPercent: number;
  leftColor: string;
  rightColor: string;
  caption?: string;
}) {
  return (
    <div className="w-full">
      <div className="h-12 w-full rounded-2xl overflow-hidden flex gap-1">
        <div
          className={`h-full flex items-center justify-center text-[10px] font-black text-white transition-all duration-1000 ${leftColor}`}
          style={{ width: `${leftPercent}%` }}
        >
          {leftPercent > 15 && `${Math.round(leftPercent)}%`}
        </div>
        <div
          className={`h-full flex items-center justify-center text-[10px] font-black text-white transition-all duration-1000 ${rightColor}`}
          style={{ width: `${rightPercent}%` }}
        >
          {rightPercent > 15 && `${Math.round(rightPercent)}%`}
        </div>
      </div>
      <div className="mt-3 flex justify-between px-1">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
          {leftLabel}
        </span>
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
          {rightLabel}
        </span>
      </div>
      {caption && (
        <p className="mt-8 text-center text-sm font-medium italic text-zinc-500 leading-relaxed">
          &quot;{caption}&quot;
        </p>
      )}
    </div>
  );
}

export default function InsightsPage() {
  const { guesses: results } = useGame();

  const summary = useMemo(() => {
    const total = results.length;
    if (!total) return null;

    const partyCorrect = results.filter((item) => item.isPartyCorrect).length;
    
    const leftResults = results.filter((r) => r.bloc === "left");
    const rightResults = results.filter((r) => r.bloc === "right");

    const leftAccuracy = leftResults.length
      ? (leftResults.filter((r) => r.isPartyCorrect).length / leftResults.length) * 100
      : 0;
    const rightAccuracy = rightResults.length
      ? (rightResults.filter((r) => r.isPartyCorrect).length / rightResults.length) * 100
      : 0;

    const leftGuesses = results.filter((r) => r.blocGuess === "left").length;
    const rightGuesses = results.filter((r) => r.blocGuess === "right").length;

    const guessTendencyLeft = (leftGuesses / total) * 100;
    const guessTendencyRight = (rightGuesses / total) * 100;

    const datasetLeft = (leftResults.length / total) * 100;
    const datasetRight = (rightResults.length / total) * 100;

    let tendencyCaption = "As tuas escolhas são equilibradas!";
    if (guessTendencyLeft > 60) tendencyCaption = "Tens uma tendência para a esquerda.";
    if (guessTendencyRight > 60) tendencyCaption = "Tens uma tendência para a direita.";

    let accuracyCaption = "És igualmente bom a identificar ambos os blocos!";
    if (Math.abs(leftAccuracy - rightAccuracy) > 15) {
      accuracyCaption = leftAccuracy > rightAccuracy 
        ? "És muito melhor a identificar a esquerda!" 
        : "És muito melhor a identificar a direita!";
    }

    const topParties = (Object.keys(partyMeta) as Party[])
      .map((p) => {
        const partyResults = results.filter((r) => r.party === p);
        return {
          party: p,
          accuracy: partyResults.length
            ? (partyResults.filter((r) => r.isPartyCorrect).length /
                partyResults.length) *
              100
            : 0,
          count: partyResults.length,
        };
      })
      .filter((s) => s.count > 0)
      .sort((a, b) => b.accuracy - a.accuracy || b.count - a.count)
      .slice(0, 4);

    return {
      total,
      partyCorrect,
      accuracy: (partyCorrect / total) * 100,
      leftAccuracy,
      rightAccuracy,
      guessTendencyLeft,
      guessTendencyRight,
      datasetLeft,
      datasetRight,
      tendencyCaption,
      accuracyCaption,
      leftCount: leftResults.length,
      rightCount: rightResults.length,
      topParties,
    };
  }, [results]);

  return (
    <div className="min-h-screen bg-[#F0F2F5] px-6 py-12 text-zinc-900 font-sans">
      <header className="mx-auto flex w-full max-w-2xl flex-col items-center mb-12">
        <h1 className="text-3xl font-black tracking-tighter text-[#1A1A1B] uppercase italic">
          Insights
        </h1>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mt-2">
          As tuas estatísticas e tendências
        </p>
        <Link
          href="/"
          className="mt-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          ← Voltar ao jogo
        </Link>
      </header>

      {!summary ? (
        <div className="mx-auto mt-12 max-w-md rounded-[2.5rem] bg-white p-12 text-center shadow-xl shadow-zinc-200/50 border border-zinc-100">
          <p className="text-sm font-bold uppercase tracking-widest text-zinc-400">
            Sem dados ainda
          </p>
          <p className="mt-4 text-zinc-500 text-sm">
            Faz algumas rondas para veres os teus insights aqui.
          </p>
        </div>
      ) : (
        <main className="mx-auto flex w-full max-w-md flex-col gap-6">
          {/* Parliament Visualization */}
          <section className="rounded-[2.5rem] bg-white p-10 shadow-xl shadow-zinc-200/50 border border-zinc-100 flex flex-col items-center">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 self-start">
              O Teu Parlamento
            </h2>
            <ParliamentChart guesses={results} />
          </section>

          {/* Main Accuracy Circle */}
          <section className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-zinc-200/50 border border-zinc-100 flex justify-center">
            <AccuracyCircle percent={summary.accuracy} />
          </section>

          {/* Party Identification Accuracy */}
          <section className="rounded-[2.5rem] bg-white p-10 shadow-xl shadow-zinc-200/50 border border-zinc-100">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-8">
              Identificação por Bloco
            </h2>
            <div className="space-y-8">
              <ProgressBar 
                label="Esquerda" 
                percent={summary.leftAccuracy} 
                colorClass="bg-rose-500"
              />
              <ProgressBar 
                label="Direita" 
                percent={summary.rightAccuracy} 
                colorClass="bg-amber-500"
              />
            </div>
            <p className="mt-10 text-center text-sm font-medium italic text-zinc-500">
              &quot;{summary.accuracyCaption}&quot;
            </p>
          </section>

          {/* Top Parties Grid */}
          <section className="rounded-[2.5rem] bg-white p-10 shadow-xl shadow-zinc-200/50 border border-zinc-100">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-8">
              Melhor Precisão por Partido
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {summary.topParties.map((item) => (
                <div
                  key={item.party}
                  className="rounded-3xl bg-zinc-50 p-6 flex flex-col items-center justify-center text-center border border-zinc-100/50"
                >
                  <span className="text-xl font-black text-zinc-900">
                    {item.party}
                  </span>
                  <span className="mt-1 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    {Math.round(item.accuracy)}% precisão
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Guessing Tendency */}
          <section className="rounded-[2.5rem] bg-white p-10 shadow-xl shadow-zinc-200/50 border border-zinc-100">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-8">
              Tendência de Escolha
            </h2>
            <SegmentedBar
              leftLabel="Esquerda"
              rightLabel="Direita"
              leftPercent={summary.guessTendencyLeft}
              rightPercent={summary.guessTendencyRight}
              leftColor="bg-rose-500"
              rightColor="bg-amber-500"
              caption={summary.tendencyCaption}
            />
          </section>

          {/* Dataset Composition */}
          <section className="rounded-[2.5rem] bg-white p-10 shadow-xl shadow-zinc-200/50 border border-zinc-100">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-8">
              Composição dos Deputados Até Agora
            </h2>
            <SegmentedBar
              leftLabel={`Esquerda (${summary.leftCount})`}
              rightLabel={`Direita (${summary.rightCount})`}
              leftPercent={summary.datasetLeft}
              rightPercent={summary.datasetRight}
              leftColor="bg-rose-500"
              rightColor="bg-amber-500"
            />
          </section>
        </main>
      )}
    </div>
  );
}
