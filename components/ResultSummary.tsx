"use client";

import { useSimulationStore } from "@/store/simulationStore";
import { formatConditionAsText } from "@/lib/parserRules";
import { topN } from "@/lib/diffEngine";

const GENDER_LABEL: Record<string, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
};

const OP_LABEL: Record<string, string> = {
  add: "条件追加",
  overwrite: "上書き",
  remove: "条件削除",
  reset: "リセット",
};

function BreakdownBar({
  breakdown,
  total,
  max = 5,
  labelMap,
}: {
  breakdown: Record<string, number>;
  total: number;
  max?: number;
  labelMap?: Record<string, string>;
}) {
  const items = topN(breakdown, max);
  if (items.length === 0) return <span className="text-gray-600 text-xs">データなし</span>;

  return (
    <div className="space-y-1.5">
      {items.map(({ key, count }) => {
        const ratio = total > 0 ? (count / total) * 100 : 0;
        const label = labelMap?.[key] ?? key;
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-28 truncate shrink-0">{label}</span>
            <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${ratio}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 w-12 text-right shrink-0">
              {ratio.toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-800 px-5 py-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function ResultSummary() {
  const currentResult = useSimulationStore((s) => s.currentResult);
  const currentCondition = useSimulationStore((s) => s.currentCondition);
  const conditionHistory = useSimulationStore((s) => s.conditionHistory);

  if (!currentResult) return null;

  const lastEntry = conditionHistory[conditionHistory.length - 1];
  const opType = lastEntry?.operationType ?? "add";
  const conditionText = formatConditionAsText(currentCondition);

  const {
    totalMatched,
    ratioToPopulation,
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
  } = currentResult;

  return (
    <div className="divide-y divide-gray-800">
      {/* 1. 操作種別 */}
      <Section title="操作種別">
        <span
          className={`text-sm font-semibold ${
            opType === "add"
              ? "text-green-400"
              : opType === "overwrite"
              ? "text-yellow-400"
              : opType === "remove"
              ? "text-red-400"
              : "text-gray-400"
          }`}
        >
          {OP_LABEL[opType] ?? opType}
        </span>
      </Section>

      {/* 7. 集計条件 */}
      <Section title="集計条件">
        <p className="text-xs text-gray-300 leading-relaxed">{conditionText}</p>
      </Section>

      {/* 8. 対象人数と構成比 */}
      <Section title="対象人数・構成比">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-white">
            {totalMatched.toLocaleString()}
          </span>
          <span className="text-gray-400 text-sm">人</span>
          <span className="text-lg font-semibold text-blue-400">
            {(ratioToPopulation * 100).toFixed(1)}%
          </span>
          <span className="text-gray-500 text-xs">/ 10,000人</span>
        </div>
        <p className="mt-2 text-xs text-gray-400">{summaryText}</p>
      </Section>

      {/* 9. 構成内訳 */}
      <Section title="構成内訳">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-600 mb-1.5">性別</p>
            <BreakdownBar
              breakdown={genderBreakdown}
              total={totalMatched}
              labelMap={GENDER_LABEL}
            />
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1.5">年代</p>
            <BreakdownBar breakdown={ageBreakdown} total={totalMatched} />
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1.5">居住地（上位5件）</p>
            <BreakdownBar breakdown={areaBreakdown} total={totalMatched} max={5} />
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1.5">年収帯</p>
            <BreakdownBar breakdown={incomeBreakdown} total={totalMatched} />
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1.5">職業（上位5件）</p>
            <BreakdownBar breakdown={occupationBreakdown} total={totalMatched} max={5} />
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1.5">世帯構成（上位5件）</p>
            <BreakdownBar breakdown={householdBreakdown} total={totalMatched} max={5} />
          </div>
        </div>
      </Section>

      {/* 10. 行動・価値観傾向 */}
      <Section title="行動・価値観傾向">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-600 mb-1.5">情報収集チャネル（上位5件）</p>
            <BreakdownBar breakdown={channelBreakdown} total={totalMatched} max={5} />
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1.5">購買スタイル</p>
            <BreakdownBar breakdown={purchaseStyleBreakdown} total={totalMatched} />
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1.5">ブランド志向</p>
            <BreakdownBar breakdown={brandPreferenceBreakdown} total={totalMatched} />
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1.5">価格感度</p>
            <BreakdownBar breakdown={priceSensitivityBreakdown} total={totalMatched} />
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1.5">購買意向カテゴリ（上位5件）</p>
            <BreakdownBar breakdown={categoryIntentBreakdown} total={totalMatched} max={5} />
          </div>
        </div>
      </Section>

      {/* 13. 示唆 */}
      <Section title="示唆・インサイト">
        {marketingInsights.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-blue-400 mb-1.5">マーケティング示唆</p>
            <ul className="space-y-1.5">
              {marketingInsights.map((insight, i) => (
                <li key={i} className="text-xs text-gray-300 leading-relaxed pl-3 border-l border-blue-800">
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {productInsights.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-purple-400 mb-1.5">プロダクト示唆</p>
            <ul className="space-y-1.5">
              {productInsights.map((insight, i) => (
                <li key={i} className="text-xs text-gray-300 leading-relaxed pl-3 border-l border-purple-800">
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {cautionPoints.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-yellow-500 mb-1.5">注意点</p>
            <ul className="space-y-1.5">
              {cautionPoints.map((point, i) => (
                <li key={i} className="text-xs text-yellow-400/80 leading-relaxed pl-3 border-l border-yellow-800">
                  ⚠ {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {marketingInsights.length === 0 &&
          productInsights.length === 0 &&
          cautionPoints.length === 0 && (
            <p className="text-xs text-gray-600">
              示唆を生成できる十分なデータがありません
            </p>
          )}
      </Section>
    </div>
  );
}
