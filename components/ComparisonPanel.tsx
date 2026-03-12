"use client";

import { useSimulationStore, selectPrevComparison, selectBaseComparison } from "@/store/simulationStore";

function DiffRow({ change }: { change: string }) {
  const isPositive = change.includes("+") && !change.includes("−");
  const isNegative = change.match(/\([-−]/);
  return (
    <li
      className={`text-xs leading-relaxed pl-3 py-0.5 border-l-2 ${
        isPositive
          ? "border-green-700 text-green-300"
          : isNegative
          ? "border-red-700 text-red-300"
          : "border-gray-700 text-gray-400"
      }`}
    >
      {change}
    </li>
  );
}

export function ComparisonPanel() {
  const currentResult = useSimulationStore((s) => s.currentResult);
  const previousResult = useSimulationStore((s) => s.previousResult);
  const baseResult = useSimulationStore((s) => s.basePopulationResult);

  const prevComparison = useSimulationStore(selectPrevComparison);
  const baseComparison = useSimulationStore(selectBaseComparison);

  if (!currentResult) return null;

  return (
    <div className="divide-y divide-gray-800">
      {/* 11. 前回との差分 */}
      <div className="px-5 py-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          前回との差分
        </h3>
        {!previousResult ? (
          <p className="text-xs text-gray-600">前回の集計結果がありません（初回実行）</p>
        ) : prevComparison ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-300">{prevComparison.summary}</p>
            {prevComparison.keyChanges.length > 1 && (
              <ul className="space-y-1 mt-2">
                {prevComparison.keyChanges.slice(1).map((change, i) => (
                  <DiffRow key={i} change={change} />
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      {/* 12. 初回全体との差分 */}
      <div className="px-5 py-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          初回全体との差分
        </h3>
        {!baseResult ? (
          <p className="text-xs text-gray-600">ベースデータを読み込み中…</p>
        ) : baseComparison ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-300">{baseComparison.summary}</p>
            {baseComparison.keyChanges.length > 1 && (
              <ul className="space-y-1 mt-2">
                {baseComparison.keyChanges.slice(1).map((change, i) => (
                  <DiffRow key={i} change={change} />
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
