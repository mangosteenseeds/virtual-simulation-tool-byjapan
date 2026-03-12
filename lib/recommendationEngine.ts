import type { SimulationResult, SimulationCondition } from "@/types/simulation";
import type { Recommendation } from "@/types/theme";
import { topN } from "@/lib/diffEngine";

// ── レコメンド生成（純関数）──────────────────────────────────────
// ルール:
//   - 最大3件
//   - deepen（深掘り）を1件以上
//   - compare（比較）を1件以上
//   - expand（横展開）を1件以上
//   - 現在の分析結果と無関係な提案は禁止
//   - 中身が重複しないこと

export function generateRecommendations(
  result: SimulationResult,
  condition: SimulationCondition
): Recommendation[] {
  const recs: Recommendation[] = [];

  const deepen = buildDeepenRec(result, condition);
  const compare = buildCompareRec(result, condition);
  const expand = buildExpandRec(result, condition);

  if (deepen) recs.push(deepen);
  if (compare) recs.push(compare);
  if (expand) recs.push(expand);

  return recs.slice(0, 3);
}

// ── 深掘り型：現在の最多属性にさらに絞り込む ────────────────────
function buildDeepenRec(
  result: SimulationResult,
  condition: SimulationCondition
): Recommendation | null {
  const { totalMatched, genderBreakdown, ageBreakdown, channelBreakdown } = result;
  if (totalMatched === 0) return null;

  // 最多性別
  const topGender = topN(genderBreakdown, 1)[0];
  // 最多年代
  const topAge = topN(ageBreakdown, 1)[0];
  // 最多チャネル
  const topChannel = topN(channelBreakdown, 1)[0];

  const genderLabel: Record<string, string> = {
    male: "男性",
    female: "女性",
    other: "その他",
  };

  // すでに性別が単一に絞られていない場合 → 最多性別 × 最多年代で深掘り
  const condGenders = condition.genders ?? [];
  const condAgeRange = condition.ageRange;

  if (topGender && topAge) {
    const gLabel = genderLabel[topGender.key] ?? topGender.key;
    const ageDecade = topAge.key.replace("代", "");
    const alreadyFiltered =
      condGenders.length === 1 &&
      condGenders[0] === topGender.key &&
      condAgeRange?.min === Number(ageDecade) &&
      condAgeRange?.max === Number(ageDecade) + 9;

    if (!alreadyFiltered) {
      const genderRatio = ((topGender.count / totalMatched) * 100).toFixed(0);
      const ageRatio = ((topAge.count / totalMatched) * 100).toFixed(0);

      return {
        id: `REC_DEEPEN_${Date.now()}`,
        type: "deepen",
        title: `${gLabel}の${topAge.key}に絞り込む`,
        reason: `現在の対象層では${gLabel}（${genderRatio}%）・${topAge.key}（${ageRatio}%）が最多セグメントです。この層に絞り込むと、より精度の高いインサイトを得られます。`,
        expectedInsight: `${gLabel}${topAge.key}特有の購買行動・価値観傾向が明確になります`,
        suggestedMemoryMode: "with_memory",
        promptText: `${topAge.key}の${gLabel}に絞り込んで`,
      };
    }
  }

  // 上記が既に適用済みなら最多チャネルで深掘り
  if (topChannel) {
    const channelRatio = ((topChannel.count / totalMatched) * 100).toFixed(0);
    const alreadyChannel =
      condition.channels?.length === 1 &&
      condition.channels[0] === topChannel.key;

    if (!alreadyChannel) {
      return {
        id: `REC_DEEPEN_CH_${Date.now()}`,
        type: "deepen",
        title: `${topChannel.key}ユーザーに絞り込む`,
        reason: `現在の対象層では「${topChannel.key}」が主要情報収集チャネル（${channelRatio}%）です。このチャネルに絞ることでよりシャープな施策設計が可能です。`,
        expectedInsight: `${topChannel.key}を重視するユーザーの購買意向・ブランド傾向が明確になります`,
        suggestedMemoryMode: "with_memory",
        promptText: `${topChannel.key}をよく見る層に絞り込んで`,
      };
    }
  }

  return null;
}

// ── 比較型：現在条件の対になるセグメントと比較 ──────────────────
function buildCompareRec(
  result: SimulationResult,
  condition: SimulationCondition
): Recommendation | null {
  const { totalMatched, genderBreakdown, incomeBreakdown, ageBreakdown } = result;
  if (totalMatched === 0) return null;

  const topGender = topN(genderBreakdown, 1)[0];
  const topIncome = topN(incomeBreakdown, 1)[0];

  // 性別が指定されている場合 → 逆性別を比較
  if (condition.genders && condition.genders.length === 1) {
    const current = condition.genders[0];
    const opposite = current === "male" ? "female" : current === "female" ? "male" : null;
    if (opposite) {
      const oppositeLabel = opposite === "male" ? "男性" : "女性";
      const currentLabel = current === "male" ? "男性" : "女性";
      return {
        id: `REC_COMPARE_GENDER_${Date.now()}`,
        type: "compare",
        title: `${oppositeLabel}と比較する`,
        reason: `現在は${currentLabel}に絞った分析です。${oppositeLabel}との比較により、性差による行動・嗜好の違いが明確になります。`,
        expectedInsight: `${currentLabel}と${oppositeLabel}の購買行動・価値観の差異が定量化できます`,
        suggestedMemoryMode: "without_memory",
        promptText: `今度は記憶なしで${oppositeLabel}を分析して`,
      };
    }
  }

  // 年収条件がある場合 → 別年収帯と比較
  if (condition.incomeBands && condition.incomeBands.length > 0) {
    const highIncomeBands = ["800〜1000万円", "1000万円以上"];
    const lowIncomeBands = ["200万円未満", "200〜400万円"];
    const isHigh = condition.incomeBands.some((b) => highIncomeBands.includes(b));
    const isLow = condition.incomeBands.some((b) => lowIncomeBands.includes(b));

    if (isHigh) {
      return {
        id: `REC_COMPARE_INCOME_${Date.now()}`,
        type: "compare",
        title: "中・低年収層と比較する",
        reason: "現在は高年収層の分析です。年収400万円未満の層と比較すると、価格感度・ブランド嗜好の差異が鮮明になります。",
        expectedInsight: "高年収層と低年収層の情報収集行動・購買スタイルの違いが可視化できます",
        suggestedMemoryMode: "without_memory",
        promptText: "記憶なしで年収400万円未満の層を分析して",
      };
    }
    if (isLow) {
      return {
        id: `REC_COMPARE_INCOME_H_${Date.now()}`,
        type: "compare",
        title: "高年収層と比較する",
        reason: "現在は低年収層の分析です。年収800万円以上の層と比較すると、購買スタイル・チャネルの違いが明確になります。",
        expectedInsight: "所得水準による購買優先順位・ブランド志向の差異が定量化できます",
        suggestedMemoryMode: "without_memory",
        promptText: "記憶なしで高収入層を分析して",
      };
    }
  }

  // 年代条件がある場合 → 別年代と比較
  if (condition.ageRange) {
    const mid = Math.floor((condition.ageRange.min + condition.ageRange.max) / 2);
    const compareAge = mid >= 40 ? "20代・30代" : "50代・60代";
    const comparePrompt = mid >= 40 ? "記憶なしで20代・30代を分析して" : "記憶なしで50代・60代を分析して";

    return {
      id: `REC_COMPARE_AGE_${Date.now()}`,
      type: "compare",
      title: `${compareAge}と比較する`,
      reason: `現在の年齢層（${condition.ageRange.min}〜${condition.ageRange.max}歳）と${compareAge}を比較すると、世代間の行動差異が明確になります。`,
      expectedInsight: `世代別の情報収集チャネル・購買頻度・ブランド志向の差異が可視化できます`,
      suggestedMemoryMode: "without_memory",
      promptText: comparePrompt,
    };
  }

  // 条件なし or その他 → 最多年収帯の反対で比較
  if (topIncome) {
    const isHighIncome = ["800〜1000万円", "1000万円以上"].includes(topIncome.key);
    if (isHighIncome) {
      return {
        id: `REC_COMPARE_INC_L_${Date.now()}`,
        type: "compare",
        title: "低年収層と比較する",
        reason: `現在の対象層は高年収帯「${topIncome.key}」が最多です。低年収層との比較で購買行動の差が明確になります。`,
        expectedInsight: "年収水準による購買優先順位・価格感度・ブランド志向の差が定量化できます",
        suggestedMemoryMode: "without_memory",
        promptText: "記憶なしで低収入層を分析して",
      };
    }
    return {
      id: `REC_COMPARE_INC_H_${Date.now()}`,
      type: "compare",
      title: "高年収層と比較する",
      reason: `現在の対象層は「${topIncome.key}」が最多です。高年収層との比較でプレミアム訴求の余地が見えます。`,
      expectedInsight: "所得水準によるブランド志向・購買スタイルの差異が可視化できます",
      suggestedMemoryMode: "without_memory",
      promptText: "記憶なしで高収入層を分析して",
    };
  }

  return null;
}

// ── 横展開型：関連する別の切り口で分析 ──────────────────────────
function buildExpandRec(
  result: SimulationResult,
  condition: SimulationCondition
): Recommendation | null {
  const { totalMatched, householdBreakdown, categoryIntentBreakdown, channelBreakdown } =
    result;
  if (totalMatched === 0) return null;

  const topHousehold = topN(householdBreakdown, 1)[0];
  const topCategory = topN(categoryIntentBreakdown, 1)[0];
  const topChannel = topN(channelBreakdown, 1)[0];

  // 子育て系条件なら → シニア層へ横展開
  const hasChildrenHousehold =
    (condition.households ?? []).some((h) =>
      h.includes("子供") || h.includes("ひとり親")
    ) ||
    (condition.lifeStages ?? []).some((l) => l.includes("子育て"));

  if (hasChildrenHousehold) {
    return {
      id: `REC_EXPAND_SENIOR_${Date.now()}`,
      type: "expand",
      title: "シニア層の購買行動を分析する",
      reason: "子育て世帯の分析結果をふまえ、同じ視点でシニア層を分析すると、ライフステージ間の購買行動差異が見えてきます。",
      expectedInsight: "子育て世帯とシニア層の情報収集チャネル・購買頻度・カテゴリ意向の違いが定量化できます",
      suggestedMemoryMode: "without_memory",
      promptText: "記憶なしでシニア層を分析して",
    };
  }

  // Instagramユーザーが多い → TikTokユーザーへ横展開
  if (topChannel?.key === "Instagram") {
    return {
      id: `REC_EXPAND_TIKTOK_${Date.now()}`,
      type: "expand",
      title: "TikTokユーザー層を分析する",
      reason: "現在の対象層はInstagramが主要チャネルです。同じビジュアル系SNSでもTikTokユーザーを分析すると、若年層へのアプローチ差異が見えます。",
      expectedInsight: "InstagramとTikTokユーザーの年齢・購買スタイル・ブランド志向の違いが可視化できます",
      suggestedMemoryMode: "without_memory",
      promptText: "記憶なしでTikTokをよく見る若い層を分析して",
    };
  }

  // 最多世帯が単身 → DINKS層へ横展開
  if (topHousehold?.key === "単身") {
    return {
      id: `REC_EXPAND_DINKS_${Date.now()}`,
      type: "expand",
      title: "DINKS層を分析する",
      reason: "現在の対象層は単身者が中心です。DINKS層は可処分所得が高く、異なる購買パターンを持つため比較価値があります。",
      expectedInsight: "単身者とDINKS層の購買頻度・ブランド志向・カテゴリ意向の差異が明確になります",
      suggestedMemoryMode: "without_memory",
      promptText: "記憶なしでDINKS（夫婦のみ・子なし共働き）を分析して",
    };
  }

  // 最多購買カテゴリから横展開
  if (topCategory) {
    const categoryExpand: Record<string, { title: string; prompt: string }> = {
      "ファッション・アパレル": {
        title: "美容・コスメ購買意向層を分析する",
        prompt: "記憶なしで美容・コスメに購買意向がある層を分析して",
      },
      "食品・日用品": {
        title: "フィットネス・健康食品購買意向層を分析する",
        prompt: "記憶なしでフィットネスや健康食品に購買意向がある層を分析して",
      },
      "家電・ガジェット": {
        title: "不動産・住宅購買意向層を分析する",
        prompt: "記憶なしで不動産・住宅に購買意向がある層を分析して",
      },
      "旅行・レジャー": {
        title: "外食・グルメ購買意向層を分析する",
        prompt: "記憶なしで外食・グルメに購買意向がある層を分析して",
      },
      "教育・自己啓発": {
        title: "投資・資産形成に関心がある層を分析する",
        prompt: "記憶なしで投資や資産形成に関心がある層を分析して",
      },
    };

    const expandInfo = categoryExpand[topCategory.key];
    if (expandInfo) {
      return {
        id: `REC_EXPAND_CAT_${Date.now()}`,
        type: "expand",
        title: expandInfo.title,
        reason: `現在の主要購買意向カテゴリ「${topCategory.key}」の周辺カテゴリを分析することで、クロスセル・関連施策の可能性が見えます。`,
        expectedInsight: `「${topCategory.key}」との親和性が高い隣接カテゴリの購買者プロファイルが明確になります`,
        suggestedMemoryMode: "without_memory",
        promptText: expandInfo.prompt,
      };
    }
  }

  // フォールバック: 地域横展開
  const topArea = topN(result.areaBreakdown, 1)[0];
  if (topArea && !(condition.areas?.length === 1)) {
    return {
      id: `REC_EXPAND_AREA_${Date.now()}`,
      type: "expand",
      title: `${topArea.key}に絞った地域分析`,
      reason: `現在の対象層では${topArea.key}が最多居住地です。地域に絞り込むと、ローカル訴求の精度が上がります。`,
      expectedInsight: `${topArea.key}在住者の特有のチャネル・購買行動傾向が明確になります`,
      suggestedMemoryMode: "with_memory",
      promptText: `${topArea.key}在住に絞って`,
    };
  }

  return null;
}

// ── レコメンドタイプのラベル・カラー ────────────────────────────
export const REC_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  deepen: {
    label: "深掘り",
    color: "text-blue-400",
    bgColor: "bg-blue-900/20",
    borderColor: "border-blue-800",
  },
  compare: {
    label: "比較",
    color: "text-yellow-400",
    bgColor: "bg-yellow-900/20",
    borderColor: "border-yellow-800",
  },
  expand: {
    label: "横展開",
    color: "text-purple-400",
    bgColor: "bg-purple-900/20",
    borderColor: "border-purple-800",
  },
};
