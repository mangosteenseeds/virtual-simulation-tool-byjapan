import type { SimulationCondition, SimulationResult } from "./simulation";

export type MemoryMode = "with_memory" | "without_memory";

export interface Theme {
  id: string;
  parentThemeId?: string | null;
  title: string;
  description: string;
  memoryMode: MemoryMode;
  promptText: string;
  objective?: string;
  inheritedConditions: string[];
  excludedConditions: string[];
  inheritedInsights: string[];
  currentCondition: SimulationCondition;
  latestResult?: SimulationResult;
  createdAt: string;
  updatedAt: string;
}

export interface Recommendation {
  id: string;
  title: string;
  type: "deepen" | "compare" | "expand";
  reason: string;
  expectedInsight: string;
  suggestedMemoryMode: MemoryMode;
  promptText: string;
}
