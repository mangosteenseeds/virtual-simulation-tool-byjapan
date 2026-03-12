import type { Theme, MemoryMode } from "@/types/theme";
import type { SimulationCondition, SimulationResult } from "@/types/simulation";
import { formatConditionAsText } from "@/lib/parserRules";

// ── テーマ作成ファクトリ ──────────────────────────────────────────
export interface CreateThemeInput {
  title: string;
  description: string;
  memoryMode: MemoryMode;
  promptText: string;
  objective?: string;
  parentTheme: Theme | null;
  currentCondition: SimulationCondition;
  latestResult?: SimulationResult;
}

export function createTheme(input: CreateThemeInput): Theme {
  const now = new Date().toISOString();
  const id = `T${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const { inheritedConditions, excludedConditions, inheritedInsights } =
    buildInheritance(input.parentTheme, input.memoryMode, input.latestResult);

  // 記憶なしの場合は現在条件を引き継がない（空の条件から開始）
  const themeCondition: SimulationCondition =
    input.memoryMode === "with_memory" && input.parentTheme
      ? input.currentCondition
      : {};

  return {
    id,
    parentThemeId: input.parentTheme?.id ?? null,
    title: input.title,
    description: input.description,
    memoryMode: input.memoryMode,
    promptText: input.promptText,
    objective: input.objective,
    inheritedConditions,
    excludedConditions,
    inheritedInsights,
    currentCondition: themeCondition,
    latestResult: input.latestResult,
    createdAt: now,
    updatedAt: now,
  };
}

// ── 引き継ぎ内容計算（純関数）────────────────────────────────────
export interface InheritanceResult {
  inheritedConditions: string[];
  excludedConditions: string[];
  inheritedInsights: string[];
}

export function buildInheritance(
  parentTheme: Theme | null,
  memoryMode: MemoryMode,
  latestResult?: SimulationResult
): InheritanceResult {
  if (!parentTheme) {
    return {
      inheritedConditions: [],
      excludedConditions: [],
      inheritedInsights: [],
    };
  }

  if (memoryMode === "with_memory") {
    // 記憶あり: 条件・示唆・テーマ背景を引き継ぐ
    const conditionText = formatConditionAsText(parentTheme.currentCondition);
    const inheritedConditions = conditionText !== "（条件なし・全体）" ? [conditionText] : [];

    const inheritedInsights: string[] = [];
    if (parentTheme.latestResult) {
      inheritedInsights.push(
        ...parentTheme.latestResult.marketingInsights.slice(0, 2),
        ...parentTheme.latestResult.productInsights.slice(0, 1)
      );
    }
    if (latestResult) {
      inheritedInsights.push(...latestResult.marketingInsights.slice(0, 1));
    }

    return {
      inheritedConditions,
      excludedConditions: [],
      inheritedInsights: [...new Set(inheritedInsights)].slice(0, 5),
    };
  } else {
    // 記憶なし: 現在条件・直前示唆・過去仮説は引き継がない
    const conditionText = formatConditionAsText(parentTheme.currentCondition);
    const excludedConditions: string[] = [];

    if (conditionText !== "（条件なし・全体）") {
      excludedConditions.push(`前テーマの条件: ${conditionText}`);
    }

    const parentInsights = parentTheme.latestResult?.marketingInsights ?? [];
    if (parentInsights.length > 0) {
      excludedConditions.push(`前テーマの示唆 (${parentInsights.length}件)`);
    }

    return {
      inheritedConditions: [],
      excludedConditions,
      inheritedInsights: [],
    };
  }
}

// ── ツリー操作ユーティリティ（純関数）────────────────────────────
export function getChildren(themes: Theme[], parentId: string): Theme[] {
  return themes.filter((t) => t.parentThemeId === parentId);
}

export function getRoots(themes: Theme[]): Theme[] {
  return themes.filter((t) => !t.parentThemeId);
}

export function getDescendants(themes: Theme[], themeId: string): Theme[] {
  const result: Theme[] = [];
  const queue = [themeId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const children = getChildren(themes, id);
    result.push(...children);
    queue.push(...children.map((c) => c.id));
  }

  return result;
}

export function getAncestors(themes: Theme[], themeId: string): Theme[] {
  const path: Theme[] = [];
  let current = themes.find((t) => t.id === themeId);

  while (current?.parentThemeId) {
    const parent = themes.find((t) => t.id === current!.parentThemeId);
    if (!parent) break;
    path.unshift(parent);
    current = parent;
  }

  return path;
}

// ツリー構造に変換（表示用）
export interface ThemeNode {
  theme: Theme;
  depth: number;
  children: ThemeNode[];
}

export function buildThemeTree(themes: Theme[]): ThemeNode[] {
  function buildNode(theme: Theme, depth: number): ThemeNode {
    const children = getChildren(themes, theme.id).map((c) =>
      buildNode(c, depth + 1)
    );
    return { theme, depth, children };
  }

  return getRoots(themes).map((root) => buildNode(root, 0));
}

// ── 記憶モードラベル ─────────────────────────────────────────────
export function memoryModeLabel(mode: MemoryMode): string {
  return mode === "with_memory" ? "記憶あり" : "記憶なし";
}

export function memoryModeDescription(mode: MemoryMode): string {
  if (mode === "with_memory") {
    return "親テーマの条件・示唆・テーマ背景を引き継ぎます";
  }
  return "条件・示唆・過去仮説をリセットして新規分析を開始します";
}
