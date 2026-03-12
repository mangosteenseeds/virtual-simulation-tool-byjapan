import type { Person, Gender } from "@/types/simulation";
import {
  POPULATION_SIZE,
  RANDOM_SEED,
  AREAS,
  AREA_WEIGHTS,
  GENDERS,
  GENDER_WEIGHTS,
  HOUSEHOLDS,
  HOUSEHOLD_WEIGHTS,
  OCCUPATIONS,
  OCCUPATION_WEIGHTS,
  INCOME_BANDS,
  INCOME_WEIGHTS,
  EDUCATION_BANDS,
  EDUCATION_WEIGHTS,
  LIFE_STAGES,
  LIFE_STAGE_WEIGHTS,
  INTERESTS,
  PURCHASE_STYLES,
  PURCHASE_STYLE_WEIGHTS,
  CHANNELS,
  PRICE_SENSITIVITY_LEVELS,
  PRICE_SENSITIVITY_WEIGHTS,
  BRAND_PREFERENCES,
  BRAND_PREFERENCE_WEIGHTS,
  DECISION_TYPES,
  DECISION_TYPE_WEIGHTS,
  PURCHASE_FREQUENCIES,
  PURCHASE_FREQUENCY_WEIGHTS,
  CATEGORY_INTENTS,
} from "@/data/populationSeed";

// ── シンプルな線形合同法 (LCG) PRNG ──────────────────────────────
// seed 固定 → 毎回同一の母集団を生成する
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) & 0xffffffff;
    return (this.seed >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pickWeighted<T>(items: T[], weights: number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  pickMultiple<T>(items: T[], minCount: number, maxCount: number): T[] {
    const count = this.nextInt(minCount, maxCount);
    const shuffled = [...items].sort(() => this.next() - 0.5);
    return shuffled.slice(0, count);
  }
}

// 年齢と職業・ライフステージの整合性調整
function adjustOccupationByAge(
  age: number,
  rng: SeededRandom
): { occupation: string; lifeStage: string } {
  if (age <= 22) {
    const occupation =
      rng.next() < 0.7 ? "学生" : rng.pickWeighted(OCCUPATIONS, OCCUPATION_WEIGHTS);
    const lifeStage = occupation === "学生" ? "学生" : "独身（若年）";
    return { occupation, lifeStage };
  }
  const occupation = rng.pickWeighted(OCCUPATIONS, OCCUPATION_WEIGHTS);
  let lifeStage: string;
  if (age >= 65) {
    lifeStage = "シニア";
  } else if (age >= 55) {
    lifeStage = rng.next() < 0.5 ? "子供独立後" : "子育て中（高校生以上）";
  } else if (age >= 40) {
    lifeStage = rng.pickWeighted(
      ["子育て中（小中学生）", "子育て中（高校生以上）", "独身（中年）", "DINKS"],
      [30, 25, 20, 25]
    );
  } else if (age >= 30) {
    lifeStage = rng.pickWeighted(
      ["子育て中（就学前）", "子育て中（小中学生）", "DINKS", "独身（中年）"],
      [30, 15, 30, 25]
    );
  } else {
    lifeStage = rng.pickWeighted(
      ["独身（若年）", "DINKS", "子育て中（就学前）"],
      [60, 25, 15]
    );
  }
  return { occupation, lifeStage };
}

// 年収と職業の整合性調整
function adjustIncomeBandByOccupation(
  occupation: string,
  rng: SeededRandom
): string {
  if (occupation === "学生") {
    return rng.pickWeighted(
      ["200万円未満", "200〜400万円"],
      [80, 20]
    );
  }
  if (occupation === "無職・求職中") {
    return rng.pickWeighted(
      ["200万円未満", "200〜400万円"],
      [70, 30]
    );
  }
  if (occupation === "専業主婦・主夫") {
    return rng.pickWeighted(
      ["200万円未満", "200〜400万円", "400〜600万円"],
      [40, 40, 20]
    );
  }
  if (occupation === "会社員（正社員）" || occupation === "公務員") {
    return rng.pickWeighted(
      ["400〜600万円", "600〜800万円", "800〜1000万円", "1000万円以上"],
      [35, 35, 20, 10]
    );
  }
  return rng.pickWeighted(INCOME_BANDS, INCOME_WEIGHTS);
}

// ── 母集団生成メイン関数 ─────────────────────────────────────────
let cachedPopulation: Person[] | null = null;

export function generatePopulation(): Person[] {
  if (cachedPopulation !== null) return cachedPopulation;

  const rng = new SeededRandom(RANDOM_SEED);
  const people: Person[] = [];

  for (let i = 0; i < POPULATION_SIZE; i++) {
    const age = rng.nextInt(15, 79);
    const gender = rng.pickWeighted<Gender>(GENDERS, GENDER_WEIGHTS);
    const area = rng.pickWeighted(AREAS, AREA_WEIGHTS);
    const household = rng.pickWeighted(HOUSEHOLDS, HOUSEHOLD_WEIGHTS);
    const { occupation, lifeStage } = adjustOccupationByAge(age, rng);
    const incomeBand = adjustIncomeBandByOccupation(occupation, rng);
    const educationBand = rng.pickWeighted(EDUCATION_BANDS, EDUCATION_WEIGHTS);
    const interests = rng.pickMultiple(INTERESTS, 2, 5);
    const purchaseStyle = rng.pickWeighted(PURCHASE_STYLES, PURCHASE_STYLE_WEIGHTS);
    const channels = rng.pickMultiple(CHANNELS, 2, 4);
    const priceSensitivity = rng.pickWeighted(
      PRICE_SENSITIVITY_LEVELS,
      PRICE_SENSITIVITY_WEIGHTS
    );
    const brandPreference = rng.pickWeighted(
      BRAND_PREFERENCES,
      BRAND_PREFERENCE_WEIGHTS
    );
    const decisionType = rng.pickWeighted(DECISION_TYPES, DECISION_TYPE_WEIGHTS);
    const purchaseFrequency = rng.pickWeighted(
      PURCHASE_FREQUENCIES,
      PURCHASE_FREQUENCY_WEIGHTS
    );
    const categoryIntent = rng.pickMultiple(CATEGORY_INTENTS, 1, 4);

    people.push({
      id: `P${String(i + 1).padStart(5, "0")}`,
      age,
      gender,
      area,
      household,
      occupation,
      incomeBand,
      educationBand,
      lifeStage,
      interests,
      purchaseStyle,
      channels,
      priceSensitivity,
      brandPreference,
      decisionType,
      purchaseFrequency,
      categoryIntent,
    });
  }

  cachedPopulation = people;
  return people;
}

// ── ユーティリティ ───────────────────────────────────────────────
export function countByKey<T extends object>(
  people: T[],
  key: keyof T
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const person of people) {
    const value = person[key];
    const label = String(value);
    result[label] = (result[label] ?? 0) + 1;
  }
  return result;
}

export function countArrayKey<T extends object>(
  people: T[],
  key: keyof T
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const person of people) {
    const values = person[key] as unknown as string[];
    if (!Array.isArray(values)) continue;
    for (const v of values) {
      result[v] = (result[v] ?? 0) + 1;
    }
  }
  return result;
}

// 年齢を10歳刻みにグループ化してカウント
export function countAgeGroups(people: Person[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const person of people) {
    const group = `${Math.floor(person.age / 10) * 10}代`;
    result[group] = (result[group] ?? 0) + 1;
  }
  return result;
}
