"use client";

import { create } from "zustand";
import type {
  SimulationCondition,
  SimulationResult,
  ParsedConditionResult,
  ConditionHistoryEntry,
  LoadingState,
} from "@/types/simulation";
import type { Theme, Recommendation, MemoryMode } from "@/types/theme";
import type { ExportState } from "@/types/export";
import { runSimulation } from "@/lib/filterEngine";
import {
  mergeConditions,
  overwriteConditions,
  removeConditionKeys,
  resetCondition,
} from "@/lib/filterEngine";
import { compareResults } from "@/lib/diffEngine";
import { parseNaturalText } from "@/lib/parserRules";

// ── ストア型定義 ──────────────────────────────────────────────────
interface SimulationState {
  // 母集団
  basePopulationResult: SimulationResult | null;

  // 条件・結果
  currentCondition: SimulationCondition;
  previousCondition: SimulationCondition | null;
  currentResult: SimulationResult | null;
  previousResult: SimulationResult | null;

  // テーマ
  currentThemeId: string | null;
  themes: Theme[];
  currentMemoryMode: MemoryMode;

  // レコメンド
  recommendations: Recommendation[];

  // エクスポート
  exportState: ExportState;

  // 履歴
  conditionHistory: ConditionHistoryEntry[];

  // パーサープレビュー
  parserPreview: ParsedConditionResult | null;

  // ローディング・エラー
  loadingState: LoadingState;
  errorState: string | null;
}

interface SimulationActions {
  // 初期化
  initBaseResult: () => void;

  // 自然文解析プレビュー
  previewParse: (text: string) => void;
  clearParserPreview: () => void;

  // 条件適用と再集計
  applyParsedCondition: (parsed: ParsedConditionResult, naturalText: string) => void;

  // テーマ操作
  addTheme: (theme: Theme) => void;
  updateTheme: (id: string, updates: Partial<Theme>) => void;
  setCurrentTheme: (id: string | null) => void;
  deleteTheme: (id: string) => void;

  // 記憶モード
  setMemoryMode: (mode: MemoryMode) => void;

  // レコメンド
  setRecommendations: (recs: Recommendation[]) => void;

  // エクスポート
  openExportModal: () => void;
  closeExportModal: () => void;

  // エラー
  setError: (msg: string | null) => void;
  setLoading: (state: LoadingState) => void;

  // リセット
  resetAll: () => void;
}

const EMPTY_EXPORT_STATE: ExportState = {
  isOpen: false,
  isGenerating: false,
  lastError: null,
  lastPayload: null,
};

// ── ストア ────────────────────────────────────────────────────────
export const useSimulationStore = create<SimulationState & SimulationActions>(
  (set, get) => ({
    // ── 初期値 ────────────────────────────────────────────────
    basePopulationResult: null,
    currentCondition: {},
    previousCondition: null,
    currentResult: null,
    previousResult: null,
    currentThemeId: null,
    themes: [],
    currentMemoryMode: "with_memory",
    recommendations: [],
    exportState: EMPTY_EXPORT_STATE,
    conditionHistory: [],
    parserPreview: null,
    loadingState: "idle",
    errorState: null,

    // ── 初期化 ────────────────────────────────────────────────
    initBaseResult: () => {
      if (get().basePopulationResult !== null) return;
      const result = runSimulation({});
      set({ basePopulationResult: result });
    },

    // ── 自然文解析プレビュー ──────────────────────────────────
    previewParse: (text: string) => {
      const parsed = parseNaturalText(text);
      set({ parserPreview: parsed });
    },

    clearParserPreview: () => {
      set({ parserPreview: null });
    },

    // ── 条件適用と再集計 ──────────────────────────────────────
    applyParsedCondition: (parsed, naturalText) => {
      const state = get();
      set({ loadingState: "filtering", errorState: null });

      try {
        let newCondition: SimulationCondition;

        switch (parsed.operationType) {
          case "reset":
            newCondition = resetCondition();
            break;
          case "overwrite":
            newCondition = overwriteConditions(
              state.currentCondition,
              parsed.extractedCondition
            );
            break;
          case "remove":
            newCondition = removeConditionKeys(
              state.currentCondition,
              parsed.extractedCondition
            );
            break;
          case "add":
          default:
            newCondition = mergeConditions(
              state.currentCondition,
              parsed.extractedCondition
            );
            break;
        }

        set({ loadingState: "aggregating" });
        const newResult = runSimulation(newCondition);

        const historyEntry: ConditionHistoryEntry = {
          id: `H${Date.now()}`,
          timestamp: new Date().toISOString(),
          operationType: parsed.operationType,
          conditionSnapshot: newCondition,
          naturalText,
          resultSnapshot: newResult,
        };

        // 現在のテーマがあれば latestResult を更新
        const updatedThemes =
          state.currentThemeId
            ? state.themes.map((t) =>
                t.id === state.currentThemeId
                  ? {
                      ...t,
                      currentCondition: newCondition,
                      latestResult: newResult,
                      updatedAt: new Date().toISOString(),
                    }
                  : t
              )
            : state.themes;

        set({
          previousCondition: state.currentCondition,
          previousResult: state.currentResult,
          currentCondition: newCondition,
          currentResult: newResult,
          conditionHistory: [...state.conditionHistory, historyEntry],
          themes: updatedThemes,
          parserPreview: null,
          loadingState: "done",
        });
      } catch (e) {
        set({
          loadingState: "error",
          errorState: e instanceof Error ? e.message : "不明なエラーが発生しました",
        });
      }
    },

    // ── テーマ操作 ────────────────────────────────────────────
    addTheme: (theme) => {
      set((state) => ({
        themes: [...state.themes, theme],
        currentThemeId: theme.id,
        currentCondition: theme.currentCondition,
        currentResult: theme.latestResult ?? null,
        previousCondition: state.currentCondition,
        previousResult: state.currentResult,
        currentMemoryMode: theme.memoryMode,
        conditionHistory: [],
      }));
    },

    updateTheme: (id, updates) => {
      set((state) => ({
        themes: state.themes.map((t) =>
          t.id === id
            ? { ...t, ...updates, updatedAt: new Date().toISOString() }
            : t
        ),
      }));
    },

    deleteTheme: (id) => {
      set((state) => ({
        themes: state.themes.filter((t) => t.id !== id),
        currentThemeId:
          state.currentThemeId === id ? null : state.currentThemeId,
      }));
    },

    setCurrentTheme: (id) => {
      const state = get();
      if (id === null) {
        set({ currentThemeId: null });
        return;
      }
      const theme = state.themes.find((t) => t.id === id);
      if (!theme) return;

      set({
        currentThemeId: id,
        currentCondition: theme.currentCondition,
        currentResult: theme.latestResult ?? null,
        previousCondition: null,
        previousResult: null,
        currentMemoryMode: theme.memoryMode,
        conditionHistory: [],
      });
    },

    // ── 記憶モード ────────────────────────────────────────────
    setMemoryMode: (mode) => {
      set({ currentMemoryMode: mode });
    },

    // ── レコメンド ────────────────────────────────────────────
    setRecommendations: (recs) => {
      set({ recommendations: recs });
    },

    // ── エクスポート ──────────────────────────────────────────
    openExportModal: () => {
      set((state) => ({
        exportState: { ...state.exportState, isOpen: true },
      }));
    },

    closeExportModal: () => {
      set((state) => ({
        exportState: { ...state.exportState, isOpen: false },
      }));
    },

    // ── ユーティリティ ────────────────────────────────────────
    setError: (msg) => set({ errorState: msg }),
    setLoading: (s) => set({ loadingState: s }),

    resetAll: () => {
      set({
        currentCondition: {},
        previousCondition: null,
        currentResult: null,
        previousResult: null,
        conditionHistory: [],
        parserPreview: null,
        loadingState: "idle",
        errorState: null,
        recommendations: [],
      });
    },
  })
);

// ── セレクタ（派生値） ────────────────────────────────────────────
export function selectPrevComparison(state: SimulationState) {
  if (!state.currentResult || !state.previousResult) return null;
  return compareResults(state.currentResult, state.previousResult);
}

export function selectBaseComparison(state: SimulationState) {
  if (!state.currentResult || !state.basePopulationResult) return null;
  return compareResults(state.currentResult, state.basePopulationResult);
}

export function selectCurrentTheme(state: SimulationState): Theme | null {
  if (!state.currentThemeId) return null;
  return state.themes.find((t) => t.id === state.currentThemeId) ?? null;
}
