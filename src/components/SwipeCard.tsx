"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";

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
  opacity?: number;
};

type PersistentSelection = {
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
  selectionOverlay?: (option: SwipeOption) => React.ReactNode;
  persistentSelections?: PersistentSelection[];
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
  selectionOverlay,
  persistentSelections,
}: SwipeCardProps) {
  const [imageError, setImageError] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [grabPoint, setGrabPoint] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isIdle, setIsIdle] = useState(false);
  const lastActivityRef = useRef<number>(0);

  useEffect(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const resetIdleTimer = useCallback(() => {
    setIsIdle(false);
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    // Reset idle timer when deputy changes or effect reinitializes
    lastActivityRef.current = Date.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsIdle(false);
    
    const checkIdle = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityRef.current > 3000 && !isDragging && !showParty && !disabled) {
        setIsIdle(true);
      }
    }, 1000);

    return () => clearInterval(checkIdle);
  }, [isDragging, showParty, disabled, deputy]);

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
    return minDim * 0.55; // Pushes bubbles to the edges/outside
  }, [dimensions]);

  const partyInfo = partyMeta[deputy.party as Party];
  const initials = useMemo(() => getInitials(deputy.name), [deputy.name]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || showParty) return;
    
    // Prevent default browser behavior (like scrolling) on touch
    if (e.pointerType === 'touch') {
      // Note: e.preventDefault() on pointerdown is sometimes needed for touch-action to be respected early
    }

    resetIdleTimer();

    // Capture the pointer to handle movement even outside the card area
    e.currentTarget.setPointerCapture(e.pointerId);

    // Calculate grab point relative to card center for natural rotation
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      setGrabPoint({
        x: (e.clientX - centerX) / (rect.width / 2),
        y: (e.clientY - centerY) / (rect.height / 2),
      });
    }

    setDragStart({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    resetIdleTimer();
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
  }, [dragOffset, options, isDragging, dynamicRadius]);

  const activeOption = useMemo(() => 
    activeOptionIndex !== -1 ? options?.[activeOptionIndex] : null
  , [activeOptionIndex, options]);

  const handlePointerUp = (e: React.PointerEvent) => {
    resetIdleTimer();
    if (!isDragging) return;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    
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
    setGrabPoint(null);
  };

  const rotation = useMemo(() => {
    if (!grabPoint) return dragOffset.x * 0.1;
    // Lever effect: grabbing the top (y < 0) and pulling right (x > 0) rotates clockwise (positive)
    // Grabbing the bottom (y > 0) and pulling right rotates counter-clockwise (negative)
    // Clamp the grabPoint impact to avoid extreme rotations if clicked far outside
    const leverY = Math.max(-2, Math.min(2, grabPoint.y));
    const lever = -leverY;
    
    // We want a base rotation even at center (y=0), but it scales with how far from center we are
    const influence = 0.4 + Math.abs(lever) * 0.6;
    return dragOffset.x * 0.08 * (lever >= 0 ? influence : -influence);
  }, [dragOffset.x, grabPoint]);

  const distance = Math.sqrt(dragOffset.x ** 2 + dragOffset.y ** 2);
  const opacity = Math.max(0.5, 1 - distance / 1000);

  const activeBorderColor = useMemo(() => {
    if (activeOption) return activeOption.color;
    if (persistentSelections && persistentSelections.length > 0) {
      return persistentSelections[persistentSelections.length - 1].color;
    }
    return "white";
  }, [activeOption, persistentSelections]);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center touch-none ${
        disabled || showParty ? "cursor-default" : isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Polygon Options Visualization */}
      {options && !showParty && (
        <div className="absolute z-20 pointer-events-none" style={{ 
          left: '50%', 
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`
        }}>
        {options.map((option, index) => {
          const angle = (index * 360) / options.length;
          const rad = (angle * Math.PI) / 180;
          const radius = dynamicRadius;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          const isActive = activeOptionIndex === index;
          
          // Scaled bubble size
          const bubbleSize = Math.max(36, Math.min(52, dynamicRadius * 0.3));
          
          return (
            <div
              key={option.id}
              className={`absolute flex flex-col items-center justify-center transition-all duration-300 ${
                isActive ? "z-30 opacity-100" : (isDragging || isIdle) ? "opacity-20" : "opacity-100"
              } ${isIdle ? "animate-flicker" : ""}`}
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${isActive ? 1.4 : 1})`,
                opacity: isActive ? 1 : 0.5
              }}
            >
              <div 
                className="rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white font-black italic"
                style={{ 
                  backgroundColor: option.color,
                  width: `${bubbleSize}px`,
                  height: `${bubbleSize}px`,
                  fontSize: `${bubbleSize * 0.20}px`,
                }}
              >
                {option.label}
              </div>
            </div>
          );
        })}
        
        {/* Active Direction Line */}
        {isDragging && distance > dynamicRadius * 0.3 && (
          <div 
            className="absolute h-1 origin-left rounded-full"
            style={{
              left: grabPoint ? `calc(50% + ${grabPoint.x * (dimensions.width / 2)}px)` : '50%',
              top: grabPoint ? `calc(50% + ${grabPoint.y * (dimensions.height / 2)}px)` : '50%',
              width: `${Math.min(distance, dynamicRadius * 1.2)}px`,
              transform: `rotate(${(Math.atan2(dragOffset.y, dragOffset.x) * 180) / Math.PI}deg)`,
              backgroundColor: activeBorderColor ? activeBorderColor + "80" : "#FFFFFF30",
            }}
          />
        )}
        </div>
      )}

      <div ref={containerRef} className={`relative w-[82%] aspect-3/4 touch-none ${isIdle ? "animate-shake" : ""}`}>
        <article
          style={{
            transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
            opacity,
            transition: isDragging ? "border-color 0.2s ease-in-out" : "all 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
            borderColor: activeBorderColor,
            touchAction: "none",
          }}
          className={`w-full h-full overflow-hidden rounded-4xl border-[6px] bg-white shadow-2xl shadow-zinc-400/50 ${className ?? ""}`}
        >
          <div className="relative w-full h-full bg-zinc-100">
          {/* Persistent Selections Bar */}
          {persistentSelections && persistentSelections.length > 0 && (
            <div className="absolute top-4 left-0 right-0 z-20 flex justify-center gap-2 pointer-events-none">
              {persistentSelections.map((sel, i) => (
                <div 
                  key={`${sel.id}-${i}`}
                  className="flex items-center gap-2 rounded-full border-2 border-white px-2 py-0.5 shadow-md animate-in slide-in-from-top-2 duration-300"
                  style={{ backgroundColor: sel.color }}
                >
                  <span className="text-[9px] font-black italic text-white uppercase tracking-tighter">
                    {sel.label}
                  </span>
                </div>
              ))}
            </div>
          )}

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

          {/* Selection Label Overlay */}
          {isDragging && activeOption && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 backdrop-blur-[1px] animate-in fade-in duration-200">
              {selectionOverlay ? (
                selectionOverlay(activeOption)
              ) : (
                <div 
                  className="scale-90 rounded-xl px-6 py-3 shadow-2xl border-2 border-white animate-in zoom-in-95 duration-200"
                  style={{ backgroundColor: activeOption.color }}
                >
                  <span className="text-2xl font-black italic text-white uppercase tracking-tighter">
                    {activeOption.label}
                  </span>
                </div>
              )}
            </div>
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
              <div className={`mb-4 rounded-full px-6 py-2 backdrop-blur-md ${isCorrect ? "bg-emerald-500" : "bg-rose-500"}`}>
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
    </div>
  );
}

