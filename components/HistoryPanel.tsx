"use client";

import { useSimulationStore } from "@/store/simulationStore";
import { formatConditionAsText } from "@/lib/parserRules";

const OP_COLOR: Record<string, string> = {
  add: "bg-green-900/40 text-green-400 border-green-800",
  overwrite: "bg-yellow-900/40 text-yellow-400 border-yellow-800",
  remove: "bg-red-900/40 text-red-400 border-red-800",
  reset: "bg-gray-800 text-gray-400 border-gray-700",
};

const OP_LABEL: Record<string, string> = {
  add: "追加",
  overwrite: "上書き",
  remove: "削除",
  reset: "リセット",
};

export function HistoryPanel() {
  const conditionHistory = useSimulationStore((s) => s.conditionHistory);

  return (
    <div className="p-4 space-y-1">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
        条件履歴
      </h2>

      {conditionHistory.length === 0 ? (
        <p className="text-xs text-gray-600 px-1">
          まだ条件を入力していません
        </p>
      ) : (
        <ol className="space-y-2">
          {[...conditionHistory].reverse().map((entry, idx) => {
            const isLatest = idx === 0;
            return (
              <li
                key={entry.id}
                className={`rounded-lg border p-3 space-y-1.5 transition-colors ${
                  isLatest
                    ? "border-blue-700 bg-blue-900/20"
                    : "border-gray-800 bg-gray-900/50"
                }`}
              >
                {/* 操作種別バッジ */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                      OP_COLOR[entry.operationType] ?? OP_COLOR.reset
                    }`}
                  >
                    {OP_LABEL[entry.operationType] ?? entry.operationType}
                  </span>
                  {isLatest && (
                    <span className="text-xs text-blue-400 font-medium">最新</span>
                  )}
                </div>

                {/* 自然文 */}
                <p className="text-xs text-gray-300 leading-snug line-clamp-2">
                  {entry.naturalText}
                </p>

                {/* 結果サマリー */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-mono text-gray-300">
                    {entry.resultSnapshot.totalMatched.toLocaleString()}人
                  </span>
                  <span>
                    ({(entry.resultSnapshot.ratioToPopulation * 100).toFixed(1)}%)
                  </span>
                </div>

                {/* 条件テキスト（簡略） */}
                <p className="text-xs text-gray-600 leading-snug line-clamp-2">
                  {formatConditionAsText(entry.conditionSnapshot)}
                </p>

                {/* タイムスタンプ */}
                <p className="text-xs text-gray-700">
                  {new Date(entry.timestamp).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
