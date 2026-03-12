"use client";

import { useSimulationStore } from "@/store/simulationStore";
import { memoryModeDescription } from "@/lib/themeEngine";
import type { MemoryMode } from "@/types/theme";

interface MemoryModeToggleProps {
  value: MemoryMode;
  onChange: (mode: MemoryMode) => void;
  size?: "sm" | "md";
}

export function MemoryModeToggle({ value, onChange, size = "md" }: MemoryModeToggleProps) {
  const isSmall = size === "sm";

  return (
    <div className="space-y-1.5">
      <div className={`flex rounded-lg overflow-hidden border border-gray-700 ${isSmall ? "text-xs" : "text-sm"}`}>
        <button
          onClick={() => onChange("with_memory")}
          className={`flex-1 px-3 py-2 font-medium transition-colors ${
            value === "with_memory"
              ? "bg-blue-700 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          記憶あり
        </button>
        <button
          onClick={() => onChange("without_memory")}
          className={`flex-1 px-3 py-2 font-medium transition-colors ${
            value === "without_memory"
              ? "bg-orange-700 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          記憶なし
        </button>
      </div>
      {!isSmall && (
        <p className="text-xs text-gray-500 leading-relaxed">
          {memoryModeDescription(value)}
        </p>
      )}
    </div>
  );
}

// グローバルトグル（ストアと連動）
export function GlobalMemoryModeToggle() {
  const currentMemoryMode = useSimulationStore((s) => s.currentMemoryMode);
  const setMemoryMode = useSimulationStore((s) => s.setMemoryMode);

  return (
    <MemoryModeToggle
      value={currentMemoryMode}
      onChange={setMemoryMode}
      size="sm"
    />
  );
}
