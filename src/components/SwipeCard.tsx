"use client";

import { useMemo, useState, useRef, useEffect } from "react";

import { partyMeta, type Party } from "@/src/data/parties";

type Deputy = {
  name: string;
  party: string;
  photoUrl: string;
};

type SwipeOption = {
  id: string;
  label: string;
  color: string;
};

type SwipeCardProps = {
  deputy: Deputy;
  showParty: boolean;
  isCorrect?: boolean;
  className?: string;
  options?: SwipeOption[];
  onSelect?: (id: string) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  disabled?: boolean;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function SwipeCard({
  deputy,
  showParty,
  isCorrect,
  className,
  options,
  onSelect,
  onSwipeLeft,
  onSwipeRight,
  disabled,
}: SwipeCardProps) {
  const [imageError, setImageError] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const dynamicRadius = useMemo(() => {
    const minDim = Math.min(dimensions.width, dimensions.height);
    if (minDim === 0) return 130;
    return minDim * 0.38;
  }, [dimensions]);

  const partyInfo = partyMeta[deputy.party as Party];
  const initials = useMemo(() => getInitials(deputy.name), [deputy.name]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || showParty) return;
    setDragStart({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStart || !isDragging) return;
    const offsetX = e.clientX - dragStart.x;
    const offsetY = e.clientY - dragStart.y;
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const activeOptionIndex = useMemo(() => {
    if (!options || options.length === 0 || !isDragging) return -1;
    const distance = Math.sqrt(dragOffset.x ** 2 + dragOffset.y ** 2);
    const deadzone = dynamicRadius * 0.3;
    if (distance < deadzone) return -1;

    // Calculate angle in degrees: 0 to 360
    // Math.atan2 returns -PI to PI
    let angle = (Math.atan2(dragOffset.y, dragOffset.x) * 180) / Math.PI;
    if (angle < 0) angle += 360;

    const segmentSize = 360 / options.length;
    // Offset by segmentSize / 2 to center the first option at 0 degrees
    const adjustedAngle = (angle + segmentSize / 2) % 360;
    return Math.floor(adjustedAngle / segmentSize);
  }, [dragOffset, options, isDragging]);

  const handlePointerUp = () => {
    if (!isDragging) return;
    
    const threshold = dynamicRadius * 0.5;
    const distance = Math.sqrt(dragOffset.x ** 2 + dragOffset.y ** 2);

    if (options && options.length > 0) {
      if (distance > threshold && activeOptionIndex !== -1) {
        onSelect?.(options[activeOptionIndex].id);
      }
    } else {
      if (dragOffset.x > threshold) {
        onSwipeRight?.();
      } else if (dragOffset.x < -threshold) {
        onSwipeLeft?.();
      }
    }
    
    setDragStart(null);
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const rotation = dragOffset.x * 0.1;
  const distance = Math.sqrt(dragOffset.x ** 2 + dragOffset.y ** 2);
  const opacity = Math.max(0.5, 1 - distance / 1000);

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
      {/* Polygon Options Visualization */}
      {isDragging && options && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {options.map((option, index) => {
            const angle = (index * 360) / options.length;
            const rad = (angle * Math.PI) / 180;
            const radius = dynamicRadius;
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;
            const isActive = activeOptionIndex === index;
            
            // Scaled bubble size
            const bubbleSize = Math.max(48, Math.min(64, dynamicRadius * 0.4));
            
            return (
              <div
                key={option.id}
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center transition-all duration-300 ${
                  isActive ? "z-30" : "opacity-40"
                }`}
                style={{
                  transformOrigin: "center center",
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${isActive ? 1.4 : 1})`,
                }}
              >
                <div 
                  className="rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white font-black italic"
                  style={{ 
                    backgroundColor: option.color,
                    width: `${bubbleSize}px`,
                    height: `${bubbleSize}px`,
                    fontSize: `${bubbleSize * 0.25}px`,
                  }}
                >
                  {option.label}
                </div>
                {isActive && (
                  <div className="absolute -bottom-8 whitespace-nowrap bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
                    {option.id}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Active Direction Line */}
          {distance > dynamicRadius * 0.3 && (
            <div 
              className="absolute left-1/2 top-1/2 h-1 bg-white/30 origin-left rounded-full"
              style={{
                width: `${Math.min(distance, dynamicRadius * 1.2)}px`,
                transform: `translate(0, -50%) rotate(${(Math.atan2(dragOffset.y, dragOffset.x) * 180) / Math.PI}deg)`,
              }}
            />
          )}
        </div>
      )}

      <article
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
          opacity,
          transition: isDragging ? "none" : "all 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
          touchAction: "none",
          cursor: isDragging ? "grabbing" : (disabled || showParty ? "default" : "grab"),
        }}
        className={`w-full overflow-hidden rounded-[2.5rem] border-[6px] border-white bg-white shadow-2xl shadow-zinc-400/50 ${className ?? ""}`}
      >
        <div className="w-full bg-zinc-100">
          {imageError ? (
            <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-zinc-400">
              {initials}
            </div>
          ) : (
            <img
              src={deputy.photoUrl}
              alt={`Foto de ${deputy.name}`}
              className="h-full w-full object-cover object-top select-none pointer-events-none"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          )}
          
          {/* Swipe Indicators for Left/Right only if no options */}
          {!options && isDragging && dragOffset.x > 30 && (
            <div className="absolute top-10 left-10 rounded-xl border-4 border-emerald-500 bg-emerald-50/10 px-4 py-2 text-3xl font-black text-emerald-500 uppercase -rotate-15 pointer-events-none backdrop-blur-sm">
              Direita
            </div>
          )}
          {!options && isDragging && dragOffset.x < -30 && (
            <div className="absolute top-10 right-10 rounded-xl border-4 border-rose-500 bg-rose-50/10 px-4 py-2 text-3xl font-black text-rose-500 uppercase rotate-15 pointer-events-none backdrop-blur-sm">
              Esquerda
            </div>
          )}

          {/* Reveal Overlay */}
          {showParty && (
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white text-center animate-in fade-in zoom-in duration-500"
              style={{ 
                backgroundColor: `${partyInfo?.color}f2`, // Adding transparency
              }}
            >
              <div className="mb-4 rounded-full bg-white/20 px-6 py-2 backdrop-blur-md">
                <span className="text-sm font-black uppercase tracking-[0.2em]">
                  {isCorrect ? "Correto" : "Errado"}
                </span>
              </div>
              
              <h2 className="text-4xl font-black tracking-tighter uppercase italic drop-shadow-lg">
                {deputy.name}
              </h2>
              <div className="mt-4 h-px w-12 bg-white/40" />
              <p className="mt-4 text-2xl font-black uppercase tracking-widest opacity-90 drop-shadow-md">
                {partyInfo?.label}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest opacity-70">
                {partyInfo?.name}
              </p>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

