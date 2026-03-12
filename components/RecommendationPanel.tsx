"use client";

import { useSimulationStore } from "@/store/simulationStore";
import { parseNaturalText } from "@/lib/parserRules";
import { REC_TYPE_CONFIG } from "@/lib/recommendationEngine";
import type { Recommendation } from "@/types/theme";

const MEMORY_LABEL: Record<string, { label: string; color: string }> = {
  with_memory: { label: "記憶あり", color: "text-blue-400" },
  without_memory: { label: "記憶なし", color: "text-orange-400" },
};

function RecCard({
  rec,
  onApply,
}: {
  rec: Recommendation;
  onApply: (rec: Recommendation) => void;
}) {
  const cfg = REC_TYPE_CONFIG[rec.type] ?? REC_TYPE_CONFIG.deepen;
  const memCfg = MEMORY_LABEL[rec.suggestedMemoryMode];

  return (
    <div
      className={`rounded-xl border ${cfg.borderColor} ${cfg.bgColor} p-4 space-y-2.5 flex flex-col`}
    >
      {/* ヘッダー */}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.borderColor} ${cfg.color}`}>
          {cfg.label}
        </span>
        <span className={`text-xs ${memCfg.color}`}>
          推奨: {memCfg.label}
        </span>
      </div>

      {/* タイトル */}
      <h4 className="text-sm font-semibold text-white leading-snug">{rec.title}</h4>

      {/* 理由 */}
      <p className="text-xs text-gray-400 leading-relaxed">{rec.reason}</p>

      {/* 期待されるインサイト */}
      <div className="text-xs text-gray-500 bg-black/20 rounded-lg px-3 py-2 leading-relaxed">
        <span className="text-gray-600">期待されるインサイト: </span>
        {rec.expectedInsight}
      </div>

      {/* ワンクリック適用ボタン */}
      <button
        onClick={() => onApply(rec)}
        className={`mt-auto w-full py-2 rounded-lg text-xs font-medium transition-colors border ${cfg.borderColor} hover:bg-white/5 ${cfg.color}`}
      >
        この分析を実行 →
      </button>
    </div>
  );
}

export function RecommendationPanel() {
  const recommendations = useSimulationStore((s) => s.recommendations);
  const currentResult = useSimulationStore((s) => s.currentResult);
  const applyParsedCondition = useSimulationStore((s) => s.applyParsedCondition);
  const setMemoryMode = useSimulationStore((s) => s.setMemoryMode);

  if (!currentResult || recommendations.length === 0) return null;

  function handleApply(rec: Recommendation) {
    // 推奨記憶モードを先にセット
    setMemoryMode(rec.suggestedMemoryMode);
    // 自然文をパースして条件適用
    const parsed = parseNaturalText(rec.promptText);
    applyParsedCondition(parsed, rec.promptText);
  }

  return (
    <div className="border-t border-gray-800 px-5 py-5 space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          次におすすめの分析
        </h3>
        <span className="text-xs text-gray-700 bg-gray-800 px-1.5 py-0.5 rounded">
          {recommendations.length}件
        </span>
      </div>

      <div className="grid gap-3">
        {recommendations.map((rec) => (
          <RecCard key={rec.id} rec={rec} onApply={handleApply} />
        ))}
      </div>
    </div>
  );
}
