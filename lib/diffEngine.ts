import type { SimulationResult, ComparisonResult } from "@/types/simulation";

// ── 2つの集計結果を比較し差分を返す（純関数）─────────────────────

export function compareResults(
  current: SimulationResult,
  base: SimulationResult
): ComparisonResult {
  const totalDifference = current.totalMatched - base.totalMatched;
  const ratioDifference = current.ratioToPopulation - base.ratioToPopulation;
  const keyChanges: string[] = [];

  // 対象人数変化
  const sign = totalDifference >= 0 ? "+" : "";
  keyChanges.push(
    `対象人数: ${base.totalMatched.toLocaleString()}人 → ${current.totalMatched.toLocaleString()}人（${sign}${totalDifference.toLocaleString()}人）`
  );

  // 性別構成変化
  const genderChanges = detectBreakdownChanges(
    "性別",
    current.genderBreakdown,
    base.genderBreakdown,
    current.totalMatched,
    base.totalMatched
  );
  keyChanges.push(...genderChanges);

  // 年齢構成変化
  const ageChanges = detectBreakdownChanges(
    "年代",
    current.ageBreakdown,
    base.ageBreakdown,
    current.totalMatched,
    base.totalMatched
  );
  keyChanges.push(...ageChanges);

  // 年収構成変化
  const incomeChanges = detectBreakdownChanges(
    "年収",
    current.incomeBreakdown,
    base.incomeBreakdown,
    current.totalMatched,
    base.totalMatched
  );
  keyChanges.push(...incomeChanges);

  // チャネル構成変化
  const channelChanges = detectBreakdownChanges(
    "チャネル",
    current.channelBreakdown,
    base.channelBreakdown,
    current.totalMatched,
    base.totalMatched
  );
  keyChanges.push(...channelChanges);

  const summary = buildDiffSummary(totalDifference, ratioDifference, keyChanges);

  return {
    totalDifference,
    ratioDifference,
    keyChanges,
    summary,
  };
}

// ── 内訳の変化を検出（比率ベースで±5pt以上を主要変化とみなす）────
function detectBreakdownChanges(
  label: string,
  current: Record<string, number>,
  base: Record<string, number>,
  currentTotal: number,
  baseTotal: number
): string[] {
  if (currentTotal === 0 || baseTotal === 0) return [];

  const changes: string[] = [];
  const allKeys = new Set([...Object.keys(current), ...Object.keys(base)]);

  for (const key of allKeys) {
    const currentCount = current[key] ?? 0;
    const baseCount = base[key] ?? 0;
    const currentRatio =
      currentTotal > 0 ? (currentCount / currentTotal) * 100 : 0;
    const baseRatio = baseTotal > 0 ? (baseCount / baseTotal) * 100 : 0;
    const diff = currentRatio - baseRatio;

    // ±5pt以上の変化のみ報告
    if (Math.abs(diff) >= 5) {
      const sign = diff >= 0 ? "+" : "";
      changes.push(
        `${label}「${key}」: ${baseRatio.toFixed(1)}% → ${currentRatio.toFixed(1)}%（${sign}${diff.toFixed(1)}pt）`
      );
    }
  }

  return changes;
}

function buildDiffSummary(
  totalDiff: number,
  ratioDiff: number,
  keyChanges: string[]
): string {
  const sign = totalDiff >= 0 ? "+" : "";
  const ratioPt = (ratioDiff * 100).toFixed(1);
  const ratioSign = ratioDiff >= 0 ? "+" : "";

  if (keyChanges.length <= 1) {
    return `対象人数は${sign}${totalDiff.toLocaleString()}人（${ratioSign}${ratioPt}pt）の変化。構成比に大きな変化はありません。`;
  }

  return `対象人数は${sign}${totalDiff.toLocaleString()}人（${ratioSign}${ratioPt}pt）の変化。${keyChanges.length - 1}項目で構成比に5pt以上の変化が見られます。`;
}

// ── パーセント表示ユーティリティ ─────────────────────────────────
export function formatRatio(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

export function formatCount(count: number): string {
  return count.toLocaleString();
}

// 上位N件を取り出す
export function topN(
  breakdown: Record<string, number>,
  n: number
): Array<{ key: string; count: number }> {
  return Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}
