"use client";

import { blocLabels, type Bloc } from "@/src/data/parties";

type BlocPickerProps = {
  selected: Bloc | null;
  onSelect: (bloc: Bloc) => void;
  disabled?: boolean;
};

export default function BlocPicker({ selected, onSelect, disabled }: BlocPickerProps) {
  const blocOptions: Bloc[] = ["left", "right"];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        1. Escolhe o bloco
      </p>
      <div className="grid grid-cols-2 gap-3">
        {blocOptions.map((bloc) => {
          const isActive = selected === bloc;
          return (
            <button
              key={bloc}
              type="button"
              onClick={() => onSelect(bloc)}
              disabled={disabled}
              className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                isActive
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
              } ${disabled ? "opacity-60" : ""}`}
            >
              {blocLabels[bloc]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
