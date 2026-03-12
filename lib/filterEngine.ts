import type { Person, SimulationCondition, SimulationResult } from "@/types/simulation";
import {
  generatePopulation,
  countByKey,
  countArrayKey,
  countAgeGroups,
} from "@/lib/population";
import { generateSummaryText, generateInsights } from "@/lib/insightEngine";

// ── フィルタ適用（純関数）─────────────────────────────────────────
export function filterPeople(
  people: Person[],
  condition: SimulationCondition
): Person[] {
  return people.filter((p) => {
    // 年齢範囲
    if (condition.ageRange !== undefined) {
      if (p.age < condition.ageRange.min || p.age > condition.ageRange.max) {
        return false;
      }
    }

    // 性別
    if (condition.genders && condition.genders.length > 0) {
      if (!condition.genders.includes(p.gender)) return false;
    }

    // 地域
    if (condition.areas && condition.areas.length > 0) {
      if (!condition.areas.includes(p.area)) return false;
    }

    // 世帯構成
    if (condition.households && condition.households.length > 0) {
      if (!condition.households.includes(p.household)) return false;
    }

    // 職業
    if (condition.occupations && condition.occupations.length > 0) {
      if (!condition.occupations.includes(p.occupation)) return false;
    }

    // 年収帯
    if (condition.incomeBands && condition.incomeBands.length > 0) {
      if (!condition.incomeBands.includes(p.incomeBand)) return false;
    }

    // 学歴
    if (condition.educationBands && condition.educationBands.length > 0) {
      if (!condition.educationBands.includes(p.educationBand)) return false;
    }

    // ライフステージ
    if (condition.lifeStages && condition.lifeStages.length > 0) {
      if (!condition.lifeStages.includes(p.lifeStage)) return false;
    }

    // 興味・関心（いずれか1つ以上一致）
    if (condition.interests && condition.interests.length > 0) {
      const hasMatch = condition.interests.some((i) => p.interests.includes(i));
      if (!hasMatch) return false;
    }

    // 購買スタイル
    if (condition.purchaseStyles && condition.purchaseStyles.length > 0) {
      if (!condition.purchaseStyles.includes(p.purchaseStyle)) return false;
    }

    // 情報収集チャネル（いずれか1つ以上一致）
    if (condition.channels && condition.channels.length > 0) {
      const hasMatch = condition.channels.some((c) => p.channels.includes(c));
      if (!hasMatch) return false;
    }

    // 価格感度
    if (condition.priceSensitivity && condition.priceSensitivity.length > 0) {
      if (!condition.priceSensitivity.includes(p.priceSensitivity)) return false;
    }

    // ブランド志向
    if (condition.brandPreference && condition.brandPreference.length > 0) {
      if (!condition.brandPreference.includes(p.brandPreference)) return false;
    }

    // 意思決定タイプ
    if (condition.decisionTypes && condition.decisionTypes.length > 0) {
      if (!condition.decisionTypes.includes(p.decisionType)) return false;
    }

    // 購入頻度
    if (condition.purchaseFrequency && condition.purchaseFrequency.length > 0) {
      if (!condition.purchaseFrequency.includes(p.purchaseFrequency)) return false;
    }

    // カテゴリ購買意向（いずれか1つ以上一致）
    if (condition.categoryIntent && condition.categoryIntent.length > 0) {
      const hasMatch = condition.categoryIntent.some((c) =>
        p.categoryIntent.includes(c)
      );
      if (!hasMatch) return false;
    }

    return true;
  });
}

// ── 集計実行（純関数）────────────────────────────────────────────
export function runSimulation(condition: SimulationCondition): SimulationResult {
  const population = generatePopulation();
  const matched = filterPeople(population, condition);
  const total = matched.length;
  const ratio = total / population.length;

  const genderBreakdown = countByKey(matched, "gender");
  const ageBreakdown = countAgeGroups(matched);
  const areaBreakdown = countByKey(matched, "area");
  const incomeBreakdown = countByKey(matched, "incomeBand");
  const occupationBreakdown = countByKey(matched, "occupation");
  const householdBreakdown = countByKey(matched, "household");
  const channelBreakdown = countArrayKey(matched, "channels");
  const purchaseStyleBreakdown = countByKey(matched, "purchaseStyle");
  const priceSensitivityBreakdown = countByKey(matched, "priceSensitivity");
  const brandPreferenceBreakdown = countByKey(matched, "brandPreference");
  const categoryIntentBreakdown = countArrayKey(matched, "categoryIntent");

  const { summaryText, marketingInsights, productInsights, cautionPoints } =
    generateInsights({
      total,
      ratio,
      condition,
      genderBreakdown,
      ageBreakdown,
      areaBreakdown,
      incomeBreakdown,
      occupationBreakdown,
      householdBreakdown,
      channelBreakdown,
      purchaseStyleBreakdown,
      priceSensitivityBreakdown,
      brandPreferenceBreakdown,
      categoryIntentBreakdown,
    });

  return {
    totalMatched: total,
    ratioToPopulation: ratio,
    genderBreakdown,
    ageBreakdown,
    areaBreakdown,
    incomeBreakdown,
    occupationBreakdown,
    householdBreakdown,
    channelBreakdown,
    purchaseStyleBreakdown,
    priceSensitivityBreakdown,
    brandPreferenceBreakdown,
    categoryIntentBreakdown,
    summaryText,
    marketingInsights,
    productInsights,
    cautionPoints,
  };
}

// ── 条件のマージ・操作（純関数）──────────────────────────────────
export function mergeConditions(
  base: SimulationCondition,
  addition: Partial<SimulationCondition>
): SimulationCondition {
  const result = { ...base };

  if (addition.ageRange !== undefined) result.ageRange = addition.ageRange;

  const arrayKeys: Array<keyof SimulationCondition> = [
    "genders",
    "areas",
    "households",
    "occupations",
    "incomeBands",
    "educationBands",
    "lifeStages",
    "interests",
    "purchaseStyles",
    "channels",
    "priceSensitivity",
    "brandPreference",
    "decisionTypes",
    "purchaseFrequency",
    "categoryIntent",
  ];

  for (const key of arrayKeys) {
    const added = addition[key] as string[] | undefined;
    if (added && added.length > 0) {
      const existing = (base[key] as string[] | undefined) ?? [];
      const merged = Array.from(new Set([...existing, ...added]));
      (result as Record<string, unknown>)[key] = merged;
    }
  }

  return result;
}

export function overwriteConditions(
  base: SimulationCondition,
  replacement: Partial<SimulationCondition>
): SimulationCondition {
  return { ...base, ...replacement };
}

export function removeConditionKeys(
  base: SimulationCondition,
  keysToRemove: Partial<SimulationCondition>
): SimulationCondition {
  const result = { ...base };

  if (keysToRemove.ageRange !== undefined) {
    delete result.ageRange;
  }

  const arrayKeys: Array<keyof SimulationCondition> = [
    "genders",
    "areas",
    "households",
    "occupations",
    "incomeBands",
    "educationBands",
    "lifeStages",
    "interests",
    "purchaseStyles",
    "channels",
    "priceSensitivity",
    "brandPreference",
    "decisionTypes",
    "purchaseFrequency",
    "categoryIntent",
  ];

  for (const key of arrayKeys) {
    const toRemove = keysToRemove[key] as string[] | undefined;
    if (toRemove && toRemove.length > 0) {
      const existing = (base[key] as string[] | undefined) ?? [];
      const filtered = existing.filter((v) => !toRemove.includes(v));
      if (filtered.length > 0) {
        (result as Record<string, unknown>)[key] = filtered;
      } else {
        delete (result as Record<string, unknown>)[key];
      }
    }
  }

  return result;
}

export function resetCondition(): SimulationCondition {
  return {};
}

// 条件が何も設定されていないか判定
export function isEmptyCondition(condition: SimulationCondition): boolean {
  return (
    condition.ageRange === undefined &&
    (!condition.genders || condition.genders.length === 0) &&
    (!condition.areas || condition.areas.length === 0) &&
    (!condition.households || condition.households.length === 0) &&
    (!condition.occupations || condition.occupations.length === 0) &&
    (!condition.incomeBands || condition.incomeBands.length === 0) &&
    (!condition.educationBands || condition.educationBands.length === 0) &&
    (!condition.lifeStages || condition.lifeStages.length === 0) &&
    (!condition.interests || condition.interests.length === 0) &&
    (!condition.purchaseStyles || condition.purchaseStyles.length === 0) &&
    (!condition.channels || condition.channels.length === 0) &&
    (!condition.priceSensitivity || condition.priceSensitivity.length === 0) &&
    (!condition.brandPreference || condition.brandPreference.length === 0) &&
    (!condition.decisionTypes || condition.decisionTypes.length === 0) &&
    (!condition.purchaseFrequency || condition.purchaseFrequency.length === 0) &&
    (!condition.categoryIntent || condition.categoryIntent.length === 0)
  );
}
