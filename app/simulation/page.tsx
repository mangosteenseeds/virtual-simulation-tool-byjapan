"use client";

import { useEffect, useState } from "react";
import { useSimulationStore, selectCurrentTheme } from "@/store/simulationStore";
import { ChatInput } from "@/components/ChatInput";
import { ConditionSummary } from "@/components/ConditionSummary";
import { ResultSummary } from "@/components/ResultSummary";
import { ComparisonPanel } from "@/components/ComparisonPanel";
import { HistoryPanel } from "@/components/HistoryPanel";
import { ThemeTreePanel } from "@/components/ThemeTreePanel";
import { GlobalMemoryModeToggle } from "@/components/MemoryModeToggle";
import { memoryModeLabel } from "@/lib/themeEngine";

type LeftTab = "history" | "themes";

export default function SimulationPage() {
  const initBaseResult = useSimulationStore((s) => s.initBaseResult);
  const loadingState = useSimulationStore((s) => s.loadingState);
  const errorState = useSimulationStore((s) => s.errorState);
  const currentResult = useSimulationStore((s) => s.currentResult);
  const currentMemoryMode = useSimulationStore((s) => s.currentMemoryMode);
  const currentTheme = useSimulationStore(selectCurrentTheme);

  const [leftTab, setLeftTab] = useState<LeftTab>("history");

  useEffect(() => {
    initBaseResult();
  }, [initBaseResult]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 text-gray-100">

      {/* ── 左カラム：履歴 / テーマツリー ── */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-800 flex flex-col overflow-hidden">
        {/* タブ */}
        <div className="flex border-b border-gray-800 flex-shrink-0">
          <button
            onClick={() => setLeftTab("history")}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              leftTab === "history"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            条件履歴
          </button>
          <button
            onClick={() => setLeftTab("themes")}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              leftTab === "themes"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            テーマ管理
          </button>
        </div>

        {/* タブコンテンツ */}
        <div className="flex-1 overflow-y-auto">
          {leftTab === "history" ? <HistoryPanel /> : <ThemeTreePanel />}
        </div>
      </aside>

      {/* ── 中央カラム：入力エリア ── */}
      <main className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* ヘッダー */}
        <header className="flex-shrink-0 border-b border-gray-800 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-bold text-lg tracking-tight whitespace-nowrap">
              仮想人口シミュレーター
            </span>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded whitespace-nowrap">
              母集団 10,000人
            </span>
            {/* 現在テーマ表示 */}
            {currentTheme && (
              <span className="text-xs text-blue-400 bg-blue-900/30 border border-blue-800 px-2 py-0.5 rounded truncate max-w-[160px]">
                {currentTheme.title}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            {/* 記憶モードトグル */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 whitespace-nowrap">記憶モード:</span>
              <GlobalMemoryModeToggle />
            </div>

            {loadingState === "filtering" || loadingState === "aggregating" ? (
              <span className="text-xs text-blue-400 animate-pulse">集計中…</span>
            ) : null}
          </div>
        </header>

        {/* 条件入力エリア */}
        <div className="flex-shrink-0 border-b border-gray-800 px-6 py-3">
          <ConditionSummary />
        </div>

        {/* テーマ情報バー */}
        {currentTheme && (
          <div className="flex-shrink-0 border-b border-gray-800 bg-gray-900/50 px-6 py-2.5 text-xs text-gray-500 flex items-center gap-4">
            <span>
              記憶モード:{" "}
              <span
                className={
                  currentTheme.memoryMode === "with_memory"
                    ? "text-blue-400"
                    : "text-orange-400"
                }
              >
                {memoryModeLabel(currentTheme.memoryMode)}
              </span>
            </span>
            {currentTheme.inheritedConditions.length > 0 && (
              <span className="text-green-500">
                引き継ぎ条件: {currentTheme.inheritedConditions.length}件
              </span>
            )}
            {currentTheme.excludedConditions.length > 0 && (
              <span className="text-orange-500">
                除外: {currentTheme.excludedConditions.length}件
              </span>
            )}
            {currentTheme.objective && (
              <span className="text-gray-600 truncate">
                目的: {currentTheme.objective}
              </span>
            )}
          </div>
        )}

        {/* メッセージエリア */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {errorState && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
              エラー: {errorState}
            </div>
          )}

          {!currentResult && (
            <div className="text-center text-gray-500 text-sm pt-8 space-y-2">
              <p>下の入力欄に自然文で条件を入力するか、サンプルを選んでください</p>
              {!currentTheme && (
                <p className="text-xs text-gray-600">
                  「テーマ管理」タブから分析テーマを作成すると、親子構造で管理できます
                </p>
              )}
            </div>
          )}
        </div>

        {/* 入力フォーム */}
        <div className="flex-shrink-0 border-t border-gray-800 px-6 py-4">
          <ChatInput />
        </div>
      </main>

      {/* ── 右カラム：結果表示 ── */}
      <aside className="w-[420px] flex-shrink-0 border-l border-gray-800 overflow-y-auto">
        {currentResult ? (
          <div>
            <ResultSummary />
            <ComparisonPanel />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm px-6 text-center">
            条件を入力すると、ここに集計結果が表示されます
          </div>
        )}
      </aside>
    </div>
  );
}
