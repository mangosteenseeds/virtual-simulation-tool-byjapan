import type { SimulationResult, SimulationCondition } from "@/types/simulation";
import type { Theme, Recommendation } from "@/types/theme";
import type { ExportPayload } from "@/types/export";
import { compareResults, topN } from "@/lib/diffEngine";
import { formatConditionAsText } from "@/lib/parserRules";
import { memoryModeLabel, getAncestors } from "@/lib/themeEngine";

// ── エクスポートに必要なコンテキスト ─────────────────────────────
export interface ExportContext {
  currentResult: SimulationResult;
  currentCondition: SimulationCondition;
  previousResult: SimulationResult | null;
  baseResult: SimulationResult;
  currentTheme: Theme | null;
  themes: Theme[];
  recommendations: Recommendation[];
  payload: ExportPayload;
}

// ── ユーティリティ ────────────────────────────────────────────────
const GENDER_LABEL: Record<string, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
};

function pct(count: number, total: number): string {
  if (total === 0) return "0.0%";
  return `${((count / total) * 100).toFixed(1)}%`;
}

function topBreakdown(
  breakdown: Record<string, number>,
  total: number,
  n = 5,
  labelMap?: Record<string, string>
): string {
  return topN(breakdown, n)
    .map(({ key, count }) => `${labelMap?.[key] ?? key}: ${count.toLocaleString()}人 (${pct(count, total)})`)
    .join("  /  ");
}

function nowString(): string {
  return new Date().toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Markdown生成 ──────────────────────────────────────────────────
export function generateMarkdown(ctx: ExportContext): string {
  const {
    currentResult,
    currentCondition,
    previousResult,
    baseResult,
    currentTheme,
    themes,
    recommendations,
  } = ctx;

  const r = currentResult;
  const total = r.totalMatched;

  const prevDiff = previousResult ? compareResults(r, previousResult) : null;
  const baseDiff = compareResults(r, baseResult);

  const lines: string[] = [];

  // 表紙
  lines.push(`# ${currentTheme?.title ?? "仮想人口シミュレーション レポート"}`);
  lines.push("");
  lines.push(`> 出力日時: ${nowString()}`);
  lines.push("");

  // テーマ情報
  if (currentTheme) {
    lines.push("## テーマ情報");
    lines.push("");
    lines.push(`- **テーマ名:** ${currentTheme.title}`);
    if (currentTheme.parentThemeId) {
      const parent = themes.find((t) => t.id === currentTheme.parentThemeId);
      if (parent) lines.push(`- **親テーマ:** ${parent.title}`);
    } else {
      lines.push("- **親テーマ:** なし（ルートテーマ）");
    }
    lines.push(`- **記憶モード:** ${memoryModeLabel(currentTheme.memoryMode)}`);
    if (currentTheme.objective) {
      lines.push(`- **分析目的:** ${currentTheme.objective}`);
    }
    if (currentTheme.inheritedConditions.length > 0) {
      lines.push(`- **引き継ぎ条件:** ${currentTheme.inheritedConditions.join(" / ")}`);
    }
    if (currentTheme.excludedConditions.length > 0) {
      lines.push(`- **除外内容:** ${currentTheme.excludedConditions.join(" / ")}`);
    }
    lines.push("");
  }

  // 集計条件
  lines.push("## 集計条件");
  lines.push("");
  lines.push(formatConditionAsText(currentCondition));
  lines.push("");

  // 対象人数
  lines.push("## 対象人数・構成比");
  lines.push("");
  lines.push(`- **対象人数:** ${total.toLocaleString()}人`);
  lines.push(`- **全体比:** ${pct(total, 10000)}（仮想母集団 10,000人中）`);
  lines.push(`- **サマリー:** ${r.summaryText}`);
  lines.push("");

  // 構成内訳
  lines.push("## 構成内訳");
  lines.push("");
  lines.push(`### 性別`);
  lines.push(topBreakdown(r.genderBreakdown, total, 3, GENDER_LABEL));
  lines.push("");
  lines.push(`### 年代`);
  lines.push(topBreakdown(r.ageBreakdown, total, 6));
  lines.push("");
  lines.push(`### 居住地（上位5件）`);
  lines.push(topBreakdown(r.areaBreakdown, total, 5));
  lines.push("");
  lines.push(`### 年収帯`);
  lines.push(topBreakdown(r.incomeBreakdown, total, 6));
  lines.push("");
  lines.push(`### 職業（上位5件）`);
  lines.push(topBreakdown(r.occupationBreakdown, total, 5));
  lines.push("");
  lines.push(`### 世帯構成（上位5件）`);
  lines.push(topBreakdown(r.householdBreakdown, total, 5));
  lines.push("");

  // 行動・価値観傾向
  lines.push("## 行動・価値観傾向");
  lines.push("");
  lines.push(`### 情報収集チャネル（上位5件）`);
  lines.push(topBreakdown(r.channelBreakdown, total, 5));
  lines.push("");
  lines.push(`### 購買スタイル`);
  lines.push(topBreakdown(r.purchaseStyleBreakdown, total, 6));
  lines.push("");
  lines.push(`### ブランド志向`);
  lines.push(topBreakdown(r.brandPreferenceBreakdown, total, 6));
  lines.push("");
  lines.push(`### 価格感度`);
  lines.push(topBreakdown(r.priceSensitivityBreakdown, total, 5));
  lines.push("");
  lines.push(`### 購買意向カテゴリ（上位5件）`);
  lines.push(topBreakdown(r.categoryIntentBreakdown, total, 5));
  lines.push("");

  // 前回との差分
  lines.push("## 前回との差分");
  lines.push("");
  if (prevDiff) {
    lines.push(prevDiff.summary);
    lines.push("");
    if (prevDiff.keyChanges.length > 1) {
      prevDiff.keyChanges.slice(1).forEach((c) => lines.push(`- ${c}`));
      lines.push("");
    }
  } else {
    lines.push("前回の集計結果なし（初回実行）");
    lines.push("");
  }

  // 初回全体との差分
  lines.push("## 初回全体との差分");
  lines.push("");
  lines.push(baseDiff.summary);
  lines.push("");
  if (baseDiff.keyChanges.length > 1) {
    baseDiff.keyChanges.slice(1).forEach((c) => lines.push(`- ${c}`));
    lines.push("");
  }

  // 示唆
  lines.push("## 示唆・インサイト");
  lines.push("");
  if (r.marketingInsights.length > 0) {
    lines.push("### マーケティング示唆");
    r.marketingInsights.forEach((ins) => lines.push(`- ${ins}`));
    lines.push("");
  }
  if (r.productInsights.length > 0) {
    lines.push("### プロダクト示唆");
    r.productInsights.forEach((ins) => lines.push(`- ${ins}`));
    lines.push("");
  }
  if (r.cautionPoints.length > 0) {
    lines.push("### 注意点");
    r.cautionPoints.forEach((p) => lines.push(`- ⚠ ${p}`));
    lines.push("");
  }

  // 次の分析提案
  if (recommendations.length > 0) {
    lines.push("## 次におすすめの分析テーマ");
    lines.push("");
    recommendations.forEach((rec, i) => {
      const typeLabel: Record<string, string> = {
        deepen: "深掘り",
        compare: "比較",
        expand: "横展開",
      };
      lines.push(`### ${i + 1}. ${rec.title} [${typeLabel[rec.type] ?? rec.type}]`);
      lines.push(`- **理由:** ${rec.reason}`);
      lines.push(`- **期待されるインサイト:** ${rec.expectedInsight}`);
      lines.push(`- **推奨記憶モード:** ${memoryModeLabel(rec.suggestedMemoryMode)}`);
      lines.push(`- **プロンプト例:** \`${rec.promptText}\``);
      lines.push("");
    });
  }

  return lines.join("\n");
}

// ── PDF用HTMLスライド生成 ─────────────────────────────────────────
export function generatePDFHTML(ctx: ExportContext): string {
  const { currentResult, currentCondition, previousResult, baseResult, currentTheme, recommendations, themes } = ctx;
  const r = currentResult;
  const total = r.totalMatched;
  const prevDiff = previousResult ? compareResults(r, previousResult) : null;
  const baseDiff = compareResults(r, baseResult);
  const condText = formatConditionAsText(currentCondition);
  const themeName = currentTheme?.title ?? "シミュレーションレポート";

  let parentName = "なし";
  if (currentTheme?.parentThemeId) {
    const parent = themes.find((t) => t.id === currentTheme.parentThemeId);
    if (parent) parentName = parent.title;
  }

  const slideCSS = `
    @page { size: A4 landscape; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif; }
    body { background: #0f172a; color: #f1f5f9; }
    .slide {
      width: 297mm; min-height: 210mm;
      page-break-after: always;
      padding: 14mm 18mm;
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
      position: relative;
      display: flex; flex-direction: column;
    }
    .slide:last-child { page-break-after: auto; }
    .slide-num {
      position: absolute; bottom: 8mm; right: 12mm;
      font-size: 9pt; color: #475569;
    }
    .slide-tag {
      font-size: 8pt; color: #64748b; letter-spacing: .12em;
      text-transform: uppercase; margin-bottom: 4mm;
    }
    h1 { font-size: 22pt; font-weight: 700; color: #f8fafc; line-height: 1.3; margin-bottom: 3mm; }
    h2 { font-size: 14pt; font-weight: 700; color: #e2e8f0; border-bottom: 1px solid #334155; padding-bottom: 2mm; margin-bottom: 4mm; }
    h3 { font-size: 11pt; font-weight: 600; color: #cbd5e1; margin-bottom: 2mm; margin-top: 4mm; }
    p, li { font-size: 9pt; color: #94a3b8; line-height: 1.7; }
    ul { padding-left: 4mm; }
    .kpi-row { display: flex; gap: 6mm; margin: 4mm 0; }
    .kpi { background: #1e293b; border: 1px solid #334155; border-radius: 3mm; padding: 4mm 6mm; flex: 1; }
    .kpi-num { font-size: 28pt; font-weight: 700; color: #38bdf8; }
    .kpi-label { font-size: 8pt; color: #64748b; margin-top: 1mm; }
    .bar-row { display: flex; align-items: center; gap: 3mm; margin-bottom: 1.5mm; }
    .bar-label { font-size: 8pt; color: #94a3b8; width: 38mm; flex-shrink: 0; }
    .bar-track { flex: 1; height: 4mm; background: #1e293b; border-radius: 2mm; overflow: hidden; }
    .bar-fill { height: 100%; background: #3b82f6; border-radius: 2mm; }
    .bar-pct { font-size: 8pt; color: #64748b; width: 12mm; text-align: right; flex-shrink: 0; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin-top: 2mm; }
    .insight-block { background: #1e293b; border-left: 3px solid #3b82f6; padding: 2mm 4mm; border-radius: 0 2mm 2mm 0; margin-bottom: 2mm; }
    .insight-block.product { border-color: #a855f7; }
    .insight-block.caution { border-color: #f59e0b; }
    .rec-card { background: #1e293b; border: 1px solid #334155; border-radius: 3mm; padding: 3mm 4mm; margin-bottom: 2mm; }
    .rec-type { font-size: 7pt; font-weight: 700; padding: 1mm 2mm; border-radius: 1mm; display: inline-block; margin-bottom: 1mm; }
    .rec-deepen { background: #1d4ed8; color: #bfdbfe; }
    .rec-compare { background: #92400e; color: #fde68a; }
    .rec-expand { background: #6b21a8; color: #e9d5ff; }
    .diff-item { font-size: 8pt; padding: 1mm 0 1mm 3mm; border-left: 2px solid #334155; margin-bottom: 1mm; color: #94a3b8; }
    .diff-item.pos { border-color: #22c55e; color: #86efac; }
    .diff-item.neg { border-color: #ef4444; color: #fca5a5; }
    .footer-meta { margin-top: auto; padding-top: 4mm; font-size: 8pt; color: #475569; }
  `;

  function barRows(breakdown: Record<string, number>, n: number, labelMap?: Record<string, string>): string {
    return topN(breakdown, n)
      .map(({ key, count }) => {
        const ratio = total > 0 ? (count / total) * 100 : 0;
        const label = labelMap?.[key] ?? key;
        return `<div class="bar-row">
          <span class="bar-label">${label}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${ratio.toFixed(1)}%"></div></div>
          <span class="bar-pct">${ratio.toFixed(1)}%</span>
        </div>`;
      })
      .join("");
  }

  const slides: string[] = [];

  // 1. 表紙
  slides.push(`<div class="slide">
    <div class="slide-tag">Research Simulation Report</div>
    <h1>${themeName}</h1>
    ${currentTheme?.description ? `<p style="margin-top:3mm;font-size:11pt;color:#94a3b8;">${currentTheme.description}</p>` : ""}
    <div style="margin-top:auto;">
      <p>親テーマ: ${parentName}</p>
      ${currentTheme ? `<p>記憶モード: ${memoryModeLabel(currentTheme.memoryMode)}</p>` : ""}
      <p>出力日時: ${nowString()}</p>
    </div>
    <div class="slide-num">1</div>
  </div>`);

  // 2. テーマ概要
  slides.push(`<div class="slide">
    <div class="slide-tag">Theme Overview</div>
    <h2>テーマ概要</h2>
    ${currentTheme ? `
      <p><strong style="color:#e2e8f0;">テーマ名:</strong> ${currentTheme.title}</p>
      ${currentTheme.objective ? `<p style="margin-top:2mm;"><strong style="color:#e2e8f0;">分析目的:</strong> ${currentTheme.objective}</p>` : ""}
      ${currentTheme.description ? `<p style="margin-top:2mm;"><strong style="color:#e2e8f0;">説明:</strong> ${currentTheme.description}</p>` : ""}
      <p style="margin-top:2mm;"><strong style="color:#e2e8f0;">記憶モード:</strong> ${memoryModeLabel(currentTheme.memoryMode)}</p>
      ${currentTheme.inheritedConditions.length > 0 ? `<p style="margin-top:2mm;color:#22c55e;">引き継ぎ条件: ${currentTheme.inheritedConditions.join(" / ")}</p>` : ""}
      ${currentTheme.excludedConditions.length > 0 ? `<p style="margin-top:2mm;color:#f97316;">除外内容: ${currentTheme.excludedConditions.join(" / ")}</p>` : ""}
    ` : "<p>フリー分析（テーマ未設定）</p>"}
    <div class="slide-num">2</div>
  </div>`);

  // 3. 集計条件
  slides.push(`<div class="slide">
    <div class="slide-tag">Filter Conditions</div>
    <h2>集計条件</h2>
    <div style="background:#1e293b;border:1px solid #334155;border-radius:3mm;padding:5mm 6mm;margin-top:3mm;">
      <p style="font-size:11pt;color:#e2e8f0;line-height:1.8;">${condText}</p>
    </div>
    <div class="slide-num">3</div>
  </div>`);

  // 4. 対象人数と構成比
  slides.push(`<div class="slide">
    <div class="slide-tag">Target Size &amp; Ratio</div>
    <h2>対象人数・構成比</h2>
    <div class="kpi-row">
      <div class="kpi">
        <div class="kpi-num">${total.toLocaleString()}</div>
        <div class="kpi-label">対象人数</div>
      </div>
      <div class="kpi">
        <div class="kpi-num">${pct(total, 10000)}</div>
        <div class="kpi-label">全体に対する比率</div>
      </div>
      <div class="kpi">
        <div class="kpi-num">10,000</div>
        <div class="kpi-label">仮想母集団（人）</div>
      </div>
    </div>
    <p style="margin-top:3mm;">${r.summaryText}</p>
    <div class="slide-num">4</div>
  </div>`);

  // 5. 属性構成
  slides.push(`<div class="slide">
    <div class="slide-tag">Attribute Breakdown</div>
    <h2>属性構成</h2>
    <div class="two-col">
      <div>
        <h3>性別</h3>
        ${barRows(r.genderBreakdown, 3, GENDER_LABEL)}
        <h3>年代</h3>
        ${barRows(r.ageBreakdown, 5)}
      </div>
      <div>
        <h3>居住地（上位5件）</h3>
        ${barRows(r.areaBreakdown, 5)}
        <h3>年収帯</h3>
        ${barRows(r.incomeBreakdown, 5)}
      </div>
    </div>
    <div class="slide-num">5</div>
  </div>`);

  // 6. 行動・価値観傾向
  slides.push(`<div class="slide">
    <div class="slide-tag">Behavioral Tendencies</div>
    <h2>行動・価値観傾向</h2>
    <div class="two-col">
      <div>
        <h3>情報収集チャネル</h3>
        ${barRows(r.channelBreakdown, 5)}
        <h3>購買スタイル</h3>
        ${barRows(r.purchaseStyleBreakdown, 4)}
      </div>
      <div>
        <h3>ブランド志向</h3>
        ${barRows(r.brandPreferenceBreakdown, 5)}
        <h3>価格感度</h3>
        ${barRows(r.priceSensitivityBreakdown, 4)}
      </div>
    </div>
    <div class="slide-num">6</div>
  </div>`);

  // 7. 前回との差分
  slides.push(`<div class="slide">
    <div class="slide-tag">Comparison with Previous</div>
    <h2>前回との差分</h2>
    ${prevDiff ? `
      <p style="margin-bottom:3mm;">${prevDiff.summary}</p>
      ${prevDiff.keyChanges.slice(1).map((c) => {
        const cls = c.includes("+") ? "pos" : c.match(/\(-/) ? "neg" : "";
        return `<div class="diff-item ${cls}">${c}</div>`;
      }).join("")}
    ` : "<p>前回の集計結果なし（初回実行）</p>"}
    <div class="slide-num">7</div>
  </div>`);

  // 8. 初回全体との差分
  slides.push(`<div class="slide">
    <div class="slide-tag">Comparison with Baseline</div>
    <h2>初回全体との差分</h2>
    <p style="margin-bottom:3mm;">${baseDiff.summary}</p>
    ${baseDiff.keyChanges.slice(1).map((c) => {
      const cls = c.includes("+") ? "pos" : c.match(/\(-/) ? "neg" : "";
      return `<div class="diff-item ${cls}">${c}</div>`;
    }).join("")}
    <div class="slide-num">8</div>
  </div>`);

  // 9. 示唆まとめ
  slides.push(`<div class="slide">
    <div class="slide-tag">Insights</div>
    <h2>示唆まとめ</h2>
    ${r.marketingInsights.length > 0 ? `
      <h3 style="color:#60a5fa;margin-top:3mm;">マーケティング示唆</h3>
      ${r.marketingInsights.map((ins) => `<div class="insight-block"><p>${ins}</p></div>`).join("")}
    ` : ""}
    ${r.productInsights.length > 0 ? `
      <h3 style="color:#c084fc;margin-top:3mm;">プロダクト示唆</h3>
      ${r.productInsights.map((ins) => `<div class="insight-block product"><p>${ins}</p></div>`).join("")}
    ` : ""}
    ${r.cautionPoints.length > 0 ? `
      <h3 style="color:#fbbf24;margin-top:3mm;">注意点</h3>
      ${r.cautionPoints.map((p) => `<div class="insight-block caution"><p>⚠ ${p}</p></div>`).join("")}
    ` : ""}
    <div class="slide-num">9</div>
  </div>`);

  // 10. 次の分析提案
  const typeClass: Record<string, string> = {
    deepen: "rec-deepen",
    compare: "rec-compare",
    expand: "rec-expand",
  };
  const typeLabel: Record<string, string> = {
    deepen: "深掘り",
    compare: "比較",
    expand: "横展開",
  };

  slides.push(`<div class="slide">
    <div class="slide-tag">Next Analysis Proposals</div>
    <h2>次の分析提案</h2>
    ${recommendations.length > 0 ? recommendations.map((rec) => `
      <div class="rec-card">
        <span class="rec-type ${typeClass[rec.type] ?? ""}">${typeLabel[rec.type] ?? rec.type}</span>
        <strong style="font-size:10pt;color:#e2e8f0;display:block;margin-bottom:1mm;">${rec.title}</strong>
        <p>${rec.reason}</p>
        <p style="margin-top:1mm;color:#64748b;">プロンプト例: <em>${rec.promptText}</em></p>
      </div>
    `).join("") : "<p>レコメンドなし</p>"}
    <div class="slide-num">10</div>
  </div>`);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${themeName}</title>
  <style>${slideCSS}</style>
</head>
<body>
  ${slides.join("\n")}
</body>
</html>`;
}

// ── PowerPoint生成 ────────────────────────────────────────────────
export async function generatePPTX(ctx: ExportContext): Promise<void> {
  // pptxgenjs はブラウザ環境でのみ動作するため動的インポート
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();

  const { currentResult, currentCondition, previousResult, baseResult, currentTheme, recommendations, themes } = ctx;
  const r = currentResult;
  const total = r.totalMatched;
  const prevDiff = previousResult ? compareResults(r, previousResult) : null;
  const baseDiff = compareResults(r, baseResult);
  const condText = formatConditionAsText(currentCondition);
  const themeName = currentTheme?.title ?? "シミュレーションレポート";

  let parentName = "なし";
  if (currentTheme?.parentThemeId) {
    const parent = themes.find((t) => t.id === currentTheme.parentThemeId);
    if (parent) parentName = parent.title;
  }

  // スライドレイアウト設定
  pptx.layout = "LAYOUT_WIDE";
  pptx.theme = { headFontFace: "Hiragino Kaku Gothic ProN", bodyFontFace: "Hiragino Kaku Gothic ProN" };

  const BG = "0F172A";
  const TEXT_PRIMARY = "F1F5F9";
  const TEXT_SECONDARY = "94A3B8";
  const TEXT_MUTED = "475569";
  const ACCENT_BLUE = "38BDF8";
  const ACCENT_PURPLE = "C084FC";
  const ACCENT_YELLOW = "FDE68A";
  const BORDER = "1E293B";

  function addSlide(title: string, slideNum: number): ReturnType<typeof pptx.addSlide> {
    const slide = pptx.addSlide();
    slide.background = { color: BG };

    // タイトル
    slide.addText(title, {
      x: 0.4, y: 0.2, w: 11.5, h: 0.55,
      fontSize: 18, bold: true, color: TEXT_PRIMARY,
      fontFace: "Hiragino Kaku Gothic ProN",
    });
    // 区切り線（矩形）
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.4, y: 0.78, w: 11.5, h: 0.02,
      fill: { color: "334155" }, line: { color: "334155" },
    });
    // ページ番号
    slide.addText(`${slideNum} / 10`, {
      x: 10.8, y: 6.8, w: 1.2, h: 0.25,
      fontSize: 8, color: TEXT_MUTED, align: "right",
    });
    return slide;
  }

  // 1. 表紙
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG };
    slide.addText("Research Simulation Report", {
      x: 0.4, y: 1.5, w: 11.5, h: 0.4,
      fontSize: 11, color: TEXT_MUTED, italic: true,
    });
    slide.addText(themeName, {
      x: 0.4, y: 2.0, w: 11.5, h: 1.2,
      fontSize: 28, bold: true, color: TEXT_PRIMARY,
      fontFace: "Hiragino Kaku Gothic ProN",
    });
    if (currentTheme?.description) {
      slide.addText(currentTheme.description, {
        x: 0.4, y: 3.3, w: 11.5, h: 0.6,
        fontSize: 13, color: TEXT_SECONDARY,
      });
    }
    slide.addText([
      { text: `親テーマ: ${parentName}  |  ` },
      { text: currentTheme ? `記憶モード: ${memoryModeLabel(currentTheme.memoryMode)}  |  ` : "" },
      { text: `出力日時: ${nowString()}` },
    ], {
      x: 0.4, y: 6.0, w: 11.5, h: 0.4,
      fontSize: 9, color: TEXT_MUTED,
    });
    slide.addText("1 / 10", {
      x: 10.8, y: 6.8, w: 1.2, h: 0.25,
      fontSize: 8, color: TEXT_MUTED, align: "right",
    });
  }

  // 2. テーマ概要
  {
    const slide = addSlide("テーマ概要", 2);
    const lines: ReturnType<typeof pptx.addSlide> extends { addText: (...args: unknown[]) => unknown } ? never : string[] = [];
    const rows = [
      currentTheme ? `テーマ名: ${currentTheme.title}` : "フリー分析",
      currentTheme?.objective ? `分析目的: ${currentTheme.objective}` : null,
      `親テーマ: ${parentName}`,
      currentTheme ? `記憶モード: ${memoryModeLabel(currentTheme.memoryMode)}` : null,
      currentTheme?.inheritedConditions.length ? `引き継ぎ条件: ${currentTheme.inheritedConditions.join(" / ")}` : null,
      currentTheme?.excludedConditions.length ? `除外内容: ${currentTheme.excludedConditions.join(" / ")}` : null,
    ].filter(Boolean) as string[];

    slide.addText(rows.map((r) => ({ text: r + "\n" })), {
      x: 0.4, y: 1.0, w: 11.5, h: 5.5,
      fontSize: 12, color: TEXT_SECONDARY, lineSpacingMultiple: 1.8,
    });
  }

  // 3. 集計条件
  {
    const slide = addSlide("集計条件", 3);
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.4, y: 1.0, w: 11.5, h: 1.5,
      fill: { color: "1E293B" }, line: { color: "334155", pt: 1 },
    });
    slide.addText(condText, {
      x: 0.6, y: 1.1, w: 11.2, h: 1.3,
      fontSize: 13, color: TEXT_PRIMARY, valign: "middle",
    });
  }

  // 4. 対象人数と構成比
  {
    const slide = addSlide("対象人数・構成比", 4);
    const kpis = [
      { num: `${total.toLocaleString()}人`, label: "対象人数" },
      { num: pct(total, 10000), label: "全体比（仮想母集団10,000人）" },
    ];
    kpis.forEach((k, i) => {
      const x = 0.4 + i * 5.8;
      slide.addShape(pptx.ShapeType.rect, {
        x, y: 1.0, w: 5.5, h: 2.0,
        fill: { color: "1E293B" }, line: { color: "334155", pt: 1 },
      });
      slide.addText(k.num, { x: x + 0.2, y: 1.2, w: 5.1, h: 1.0, fontSize: 32, bold: true, color: ACCENT_BLUE });
      slide.addText(k.label, { x: x + 0.2, y: 2.2, w: 5.1, h: 0.5, fontSize: 9, color: TEXT_MUTED });
    });
    slide.addText(r.summaryText, {
      x: 0.4, y: 3.2, w: 11.5, h: 1.0,
      fontSize: 10, color: TEXT_SECONDARY, wrap: true,
    });
  }

  // 5. 属性構成
  {
    const slide = addSlide("属性構成", 5);
    const leftItems = topN(r.genderBreakdown, 3).map(({ key, count }) =>
      `${GENDER_LABEL[key] ?? key}: ${pct(count, total)}`
    ).join("  /  ");
    const ageItems = topN(r.ageBreakdown, 5).map(({ key, count }) =>
      `${key}: ${pct(count, total)}`
    ).join("  /  ");
    const areaItems = topN(r.areaBreakdown, 5).map(({ key, count }) =>
      `${key}: ${pct(count, total)}`
    ).join("  /  ");
    const incomeItems = topN(r.incomeBreakdown, 5).map(({ key, count }) =>
      `${key}: ${pct(count, total)}`
    ).join("  /  ");

    const textRows = [
      `【性別】${leftItems}`,
      `【年代】${ageItems}`,
      `【居住地（上位5件）】${areaItems}`,
      `【年収帯】${incomeItems}`,
    ];
    slide.addText(textRows.map((row) => ({ text: row + "\n" })), {
      x: 0.4, y: 1.0, w: 11.5, h: 5.5,
      fontSize: 10, color: TEXT_SECONDARY, lineSpacingMultiple: 2.0,
    });
  }

  // 6. 行動・価値観傾向
  {
    const slide = addSlide("行動・価値観傾向", 6);
    const chItems = topN(r.channelBreakdown, 5).map(({ key, count }) =>
      `${key}: ${pct(count, total)}`
    ).join("  /  ");
    const psItems = topN(r.purchaseStyleBreakdown, 4).map(({ key, count }) =>
      `${key}: ${pct(count, total)}`
    ).join("  /  ");
    const bpItems = topN(r.brandPreferenceBreakdown, 4).map(({ key, count }) =>
      `${key}: ${pct(count, total)}`
    ).join("  /  ");
    const prItems = topN(r.priceSensitivityBreakdown, 3).map(({ key, count }) =>
      `${key.slice(0, 20)}: ${pct(count, total)}`
    ).join("  /  ");

    const textRows = [
      `【情報収集チャネル】${chItems}`,
      `【購買スタイル】${psItems}`,
      `【ブランド志向】${bpItems}`,
      `【価格感度】${prItems}`,
    ];
    slide.addText(textRows.map((row) => ({ text: row + "\n" })), {
      x: 0.4, y: 1.0, w: 11.5, h: 5.5,
      fontSize: 10, color: TEXT_SECONDARY, lineSpacingMultiple: 2.0,
    });
  }

  // 7. 前回との差分
  {
    const slide = addSlide("前回との差分", 7);
    if (prevDiff) {
      slide.addText(prevDiff.summary, {
        x: 0.4, y: 1.0, w: 11.5, h: 0.6, fontSize: 11, color: TEXT_PRIMARY,
      });
      const changes = prevDiff.keyChanges.slice(1).slice(0, 8);
      slide.addText(changes.map((c) => ({ text: `• ${c}\n` })), {
        x: 0.4, y: 1.8, w: 11.5, h: 4.5,
        fontSize: 10, color: TEXT_SECONDARY, lineSpacingMultiple: 1.8,
      });
    } else {
      slide.addText("前回の集計結果なし（初回実行）", {
        x: 0.4, y: 1.0, w: 11.5, h: 0.5, fontSize: 11, color: TEXT_MUTED,
      });
    }
  }

  // 8. 初回全体との差分
  {
    const slide = addSlide("初回全体との差分", 8);
    slide.addText(baseDiff.summary, {
      x: 0.4, y: 1.0, w: 11.5, h: 0.6, fontSize: 11, color: TEXT_PRIMARY,
    });
    const changes = baseDiff.keyChanges.slice(1).slice(0, 8);
    slide.addText(changes.map((c) => ({ text: `• ${c}\n` })), {
      x: 0.4, y: 1.8, w: 11.5, h: 4.5,
      fontSize: 10, color: TEXT_SECONDARY, lineSpacingMultiple: 1.8,
    });
  }

  // 9. 示唆まとめ
  {
    const slide = addSlide("示唆まとめ", 9);
    let y = 1.0;
    if (r.marketingInsights.length > 0) {
      slide.addText("● マーケティング示唆", { x: 0.4, y, w: 11.5, h: 0.4, fontSize: 11, bold: true, color: ACCENT_BLUE });
      y += 0.45;
      r.marketingInsights.slice(0, 3).forEach((ins) => {
        slide.addText(ins, { x: 0.6, y, w: 11.2, h: 0.45, fontSize: 9, color: TEXT_SECONDARY, wrap: true });
        y += 0.5;
      });
    }
    if (r.productInsights.length > 0) {
      slide.addText("● プロダクト示唆", { x: 0.4, y, w: 11.5, h: 0.4, fontSize: 11, bold: true, color: ACCENT_PURPLE });
      y += 0.45;
      r.productInsights.slice(0, 3).forEach((ins) => {
        slide.addText(ins, { x: 0.6, y, w: 11.2, h: 0.45, fontSize: 9, color: TEXT_SECONDARY, wrap: true });
        y += 0.5;
      });
    }
    if (r.cautionPoints.length > 0) {
      slide.addText("● 注意点", { x: 0.4, y, w: 11.5, h: 0.4, fontSize: 11, bold: true, color: ACCENT_YELLOW });
      y += 0.45;
      r.cautionPoints.slice(0, 2).forEach((pt) => {
        slide.addText(`⚠ ${pt}`, { x: 0.6, y, w: 11.2, h: 0.45, fontSize: 9, color: "FDE68A", wrap: true });
        y += 0.5;
      });
    }
  }

  // 10. 次の分析提案
  {
    const slide = addSlide("次の分析提案", 10);
    const tlabel: Record<string, string> = { deepen: "深掘り", compare: "比較", expand: "横展開" };
    let y = 1.0;
    recommendations.slice(0, 3).forEach((rec, i) => {
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.4, y, w: 11.5, h: 1.5,
        fill: { color: "1E293B" }, line: { color: "334155", pt: 1 },
      });
      slide.addText(`[${tlabel[rec.type] ?? rec.type}] ${rec.title}`, {
        x: 0.6, y: y + 0.1, w: 11.1, h: 0.45,
        fontSize: 11, bold: true, color: TEXT_PRIMARY,
      });
      slide.addText(rec.reason, {
        x: 0.6, y: y + 0.55, w: 11.1, h: 0.5,
        fontSize: 8, color: TEXT_SECONDARY, wrap: true,
      });
      slide.addText(`プロンプト例: ${rec.promptText}`, {
        x: 0.6, y: y + 1.1, w: 11.1, h: 0.3,
        fontSize: 8, color: TEXT_MUTED, italic: true,
      });
      y += 1.65;
    });
    if (recommendations.length === 0) {
      slide.addText("レコメンドなし", { x: 0.4, y: 1.0, w: 11.5, h: 0.5, fontSize: 11, color: TEXT_MUTED });
    }
  }

  await pptx.writeFile({ fileName: ctx.payload.fileName });
}
