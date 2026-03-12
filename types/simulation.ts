export type Gender = "male" | "female" | "other";

export interface Person {
  id: string;
  age: number;
  gender: Gender;
  area: string;
  household: string;
  occupation: string;
  incomeBand: string;
  educationBand: string;
  lifeStage: string;
  interests: string[];
  purchaseStyle: string;
  channels: string[];
  priceSensitivity: string;
  brandPreference: string;
  decisionType: string;
  purchaseFrequency: string;
  categoryIntent: string[];
}

export interface SimulationCondition {
  ageRange?: { min: number; max: number };
  genders?: string[];
  areas?: string[];
  households?: string[];
  occupations?: string[];
  incomeBands?: string[];
  educationBands?: string[];
  lifeStages?: string[];
  interests?: string[];
  purchaseStyles?: string[];
  channels?: string[];
  priceSensitivity?: string[];
  brandPreference?: string[];
  decisionTypes?: string[];
  purchaseFrequency?: string[];
  categoryIntent?: string[];
}

export type OperationType = "add" | "overwrite" | "remove" | "reset";

export interface ParsedConditionResult {
  operationType: OperationType;
  extractedCondition: Partial<SimulationCondition>;
  normalizedText: string;
  ambiguities: string[];
  assumedInterpretation: string[];
}

export interface SimulationResult {
  totalMatched: number;
  ratioToPopulation: number;
  genderBreakdown: Record<string, number>;
  ageBreakdown: Record<string, number>;
  areaBreakdown: Record<string, number>;
  incomeBreakdown: Record<string, number>;
  occupationBreakdown: Record<string, number>;
  householdBreakdown: Record<string, number>;
  channelBreakdown: Record<string, number>;
  purchaseStyleBreakdown: Record<string, number>;
  priceSensitivityBreakdown: Record<string, number>;
  brandPreferenceBreakdown: Record<string, number>;
  categoryIntentBreakdown: Record<string, number>;
  summaryText: string;
  marketingInsights: string[];
  productInsights: string[];
  cautionPoints: string[];
}

export interface ComparisonResult {
  totalDifference: number;
  ratioDifference: number;
  keyChanges: string[];
  summary: string;
}

export interface ConditionHistoryEntry {
  id: string;
  timestamp: string;
  operationType: OperationType;
  conditionSnapshot: SimulationCondition;
  naturalText: string;
  resultSnapshot: SimulationResult;
}

export type LoadingState = "idle" | "parsing" | "filtering" | "aggregating" | "done" | "error";
