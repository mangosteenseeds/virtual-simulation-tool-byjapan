import type { SimulationCondition } from "@/types/simulation";
import { topN } from "@/lib/diffEngine";

interface InsightInput {
  total: number;
  ratio: number;
  condition: SimulationCondition;
  genderBreakdown: Record<string, number>;
  ageBreakdown: Record<string, number>;
  areaBreakdown: Record<string, number>;
  incomeBreakdown: Record<string, number>;
  occupationBreakdown: Record<string, number>;
  householdBreakdown: Record<string, number>;
  channelBreakdown: Record<string, number>;
  purchaseStyleBreakdown: Record<string, number>;
  priceSensitivityBreakdown: Record<string, number>;
  brandPreferenceBreakdown: Record<string, number>;
  categoryIntentBreakdown: Record<string, number>;
}

interface InsightOutput {
  summaryText: string;
  marketingInsights: string[];
  productInsights: string[];
  cautionPoints: string[];
}

// ── 比率から上位ラベルを取得するユーティリティ ───────────────────
function topLabel(breakdown: Record<string, number>, n = 1): string[] {
  return topN(breakdown, n).map((e) => e.key);
}

function ratioOf(
  breakdown: Record<string, number>,
  key: string,
  total: number
): number {
  if (total === 0) return 0;
  return ((breakdown[key] ?? 0) / total) * 100;
}

// ── 価格感度ラベルを短縮 ─────────────────────────────────────────
function shortPriceSensitivity(label: string): string {
  if (label.includes("非常に高い")) return "価格にかなりシビア";
  if (label.includes("高い")) return "価格重視";
  if (label.includes("普通")) return "バランス重視";
  if (label.includes("低い")) return "品質・体験重視";
  if (label.includes("非常に低い")) return "価格ほぼ気にしない";
  return label;
}

// ── サマリーテキスト生成（ルールベース）──────────────────────────
export function generateInsights(input: InsightInput): InsightOutput {
  const {
    total,
    ratio,
    genderBreakdown,
    ageBreakdown,
    areaBreakdown,
    incomeBreakdown,
    channelBreakdown,
    purchaseStyleBreakdown,
    priceSensitivityBreakdown,
    brandPreferenceBreakdown,
    categoryIntentBreakdown,
  } = input;

  const pct = (ratio * 100).toFixed(1);

  if (total === 0) {
    return {
      summaryText: "条件に該当する対象者がいませんでした。条件を緩めて再試行してください。",
      marketingInsights: [],
      productInsights: [],
      cautionPoints: ["該当者数がゼロです。条件の組み合わせが厳しすぎる可能性があります。"],
    };
  }

  // 上位属性を取得
  const topGenders = topLabel(genderBreakdown, 2);
  const topAges = topLabel(ageBreakdown, 2);
  const topAreas = topLabel(areaBreakdown, 2);
  const topIncome = topLabel(incomeBreakdown, 1)[0] ?? "不明";
  const topChannel = topLabel(channelBreakdown, 2);
  const topPurchaseStyle = topLabel(purchaseStyleBreakdown, 1)[0] ?? "不明";
  const topPrice = topLabel(priceSensitivityBreakdown, 1)[0] ?? "不明";
  const topBrand = topLabel(brandPreferenceBreakdown, 1)[0] ?? "不明";
  const topCategories = topLabel(categoryIntentBreakdown, 3);

  const genderLabel: Record<string, string> = {
    male: "男性",
    female: "女性",
    other: "その他",
  };
  const genderStr = topGenders.map((g) => genderLabel[g] ?? g).join("・");

  // ── サマリーテキスト ─────────────────────────────────────────
  const summaryText =
    `対象人数 ${total.toLocaleString()}人（全体の${pct}%）。` +
    `主に${genderStr}、${topAges.join("・")}が中心層。` +
    `主要居住地は${topAreas.join("・")}。` +
    `最多年収帯は「${topIncome}」。` +
    `情報収集は「${topChannel.join("・")}」が上位。`;

  // ── マーケティング示唆（ルールベース）───────────────────────
  const marketingInsights: string[] = [];

  // チャネル示唆
  if (topChannel.includes("Instagram") || topChannel.includes("TikTok")) {
    marketingInsights.push(
      `主要チャネルが「${topChannel.filter((c) => ["Instagram", "TikTok"].includes(c)).join("・")}」のため、ビジュアル訴求型のSNS広告が有効です。`
    );
  }
  if (topChannel.includes("YouTube")) {
    marketingInsights.push("YouTubeが主要チャネルに含まれるため、動画コンテンツによる認知獲得を優先してください。");
  }
  if (topChannel.includes("テレビ") || topChannel.includes("新聞・雑誌")) {
    marketingInsights.push("マスメディアが主要チャネルに含まれるため、テレビCMや紙面広告での認知施策が有効です。");
  }
  if (topChannel.includes("口コミサイト")) {
    marketingInsights.push("口コミサイトを重視する層のため、レビュー獲得・評価管理を重点施策にしてください。");
  }

  // 購買スタイル示唆
  if (topPurchaseStyle === "リサーチ重視型") {
    marketingInsights.push("購買前に徹底的にリサーチする層が多いため、スペック比較ページや第三者レビューの充実が重要です。");
  }
  if (topPurchaseStyle === "口コミ重視型") {
    marketingInsights.push("口コミを重視する層が中心のため、UGC（ユーザー生成コンテンツ）の醸成が効果的です。");
  }
  if (topPurchaseStyle === "衝動的・感情型") {
    marketingInsights.push("衝動買い傾向が強い層のため、期間限定セールや感情に訴えるクリエイティブが有効です。");
  }

  // ── プロダクト示唆 ──────────────────────────────────────────
  const productInsights: string[] = [];

  // 価格感度示唆
  const priceShort = shortPriceSensitivity(topPrice);
  if (topPrice.includes("高い") || topPrice.includes("非常に高い")) {
    productInsights.push(`価格感度が高い（${priceShort}）ため、コストパフォーマンスの訴求や価格比較しやすい設計が必要です。`);
  } else if (topPrice.includes("低い") || topPrice.includes("非常に低い")) {
    productInsights.push(`価格感度が低い（${priceShort}）ため、高付加価値・プレミアム路線の訴求が有効です。`);
  } else {
    productInsights.push(`価格と品質のバランスを重視する層のため、コスパと品質の両面をアピールする設計が有効です。`);
  }

  // ブランド志向示唆
  if (topBrand === "ハイブランド志向") {
    productInsights.push("ハイブランド志向が高いため、ブランドストーリーや希少性の訴求が効果的です。");
  } else if (topBrand === "ノーブランド・コスパ志向") {
    productInsights.push("コスパ志向が強いため、価格訴求・セット販売・まとめ割引などが有効です。");
  } else if (topBrand === "日本製・国内ブランド志向") {
    productInsights.push("国産・日本製への信頼が高いため、製造・品質管理の国内性を前面に出した訴求が有効です。");
  }

  // カテゴリ示唆
  if (topCategories.length > 0) {
    productInsights.push(
      `主要購買意向カテゴリ「${topCategories.join("・")}」との親和性が高いため、クロスセル・コラボ施策が検討できます。`
    );
  }

  // ── 注意点 ──────────────────────────────────────────────────
  const cautionPoints: string[] = [];

  if (ratio < 0.05) {
    cautionPoints.push(
      `対象が全体の${pct}%と非常に少数のため、施策コストに対する対象規模の確認が必要です。`
    );
  }
  if (ratio > 0.5) {
    cautionPoints.push(
      `対象が全体の${pct}%と広範なため、セグメント細分化による訴求精度向上を検討してください。`
    );
  }

  // 単一チャネル依存
  const channelKeys = Object.keys(channelBreakdown);
  if (channelKeys.length === 1) {
    cautionPoints.push("情報収集チャネルが単一に偏っているため、チャネル多様化の検討を推奨します。");
  }

  // 性別集中
  const femaleRatio = ratioOf(genderBreakdown, "female", total);
  const maleRatio = ratioOf(genderBreakdown, "male", total);
  if (femaleRatio > 80) {
    cautionPoints.push("女性比率が80%以上と高いため、男性向け施策との並行運用を検討できます。");
  }
  if (maleRatio > 80) {
    cautionPoints.push("男性比率が80%以上と高いため、女性向け施策との並行運用を検討できます。");
  }

  return { summaryText, marketingInsights, productInsights, cautionPoints };
}

// ── 全体集計（条件なし）用のサマリー生成 ─────────────────────────
export function generateSummaryText(
  total: number,
  ratio: number
): string {
  return `対象人数 ${total.toLocaleString()}人（全体の${(ratio * 100).toFixed(1)}%）`;
}
