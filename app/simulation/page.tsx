"use client";

import { useEffect } from "react";
import { useSimulationStore } from "@/store/simulationStore";
import { ChatInput } from "@/components/ChatInput";
import { ConditionSummary } from "@/components/ConditionSummary";
import { ResultSummary } from "@/components/ResultSummary";
import { ComparisonPanel } from "@/components/ComparisonPanel";
import { HistoryPanel } from "@/components/HistoryPanel";

export default function SimulationPage() {
  const initBaseResult = useSimulationStore((s) => s.initBaseResult);
  const loadingState = useSimulationStore((s) => s.loadingState);
  const errorState = useSimulationStore((s) => s.errorState);
  const currentResult = useSimulationStore((s) => s.currentResult);

  useEffect(() => {
    initBaseResult();
  }, [initBaseResult]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 text-gray-100">
      {/* 左カラム：条件履歴 */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-800 overflow-y-auto">
        <HistoryPanel />
      </aside>

      {/* 中央カラム：入力エリア */}
      <main className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* ヘッダー */}
        <header className="flex-shrink-0 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg tracking-tight">
              仮想人口シミュレーター
            </span>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
              母集団 10,000人
            </span>
          </div>
          {loadingState === "filtering" || loadingState === "aggregating" ? (
            <span className="text-xs text-blue-400 animate-pulse">集計中…</span>
          ) : null}
        </header>

        {/* 条件入力エリア */}
        <div className="flex-shrink-0 border-b border-gray-800 px-6 py-4">
          <ConditionSummary />
        </div>

        {/* チャット入力 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {errorState && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
              エラー: {errorState}
            </div>
          )}

          {!currentResult && (
            <div className="text-center text-gray-500 text-sm pt-8">
              下の入力欄に自然文で条件を入力するか、サンプルを選んでください
            </div>
          )}
        </div>

        {/* 入力フォーム */}
        <div className="flex-shrink-0 border-t border-gray-800 px-6 py-4">
          <ChatInput />
        </div>
      </main>

      {/* 右カラム：結果表示 */}
      <aside className="w-[420px] flex-shrink-0 border-l border-gray-800 overflow-y-auto">
        {currentResult ? (
          <div className="space-y-0">
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
