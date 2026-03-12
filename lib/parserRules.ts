import type {
  SimulationCondition,
  ParsedConditionResult,
  OperationType,
} from "@/types/simulation";

// ── 操作種別の判定 ────────────────────────────────────────────────
const RESET_PATTERNS = [
  /最初から/,
  /やり直し/,
  /リセット/,
  /全部クリア/,
  /条件を消/,
  /クリアして/,
  /初期化/,
];

const REMOVE_PATTERNS = [
  /外して/,
  /除いて/,
  /削除して/,
  /条件を?(外|除)/,
  /なしで/,
  /を?取り除/,
];

const OVERWRITE_PATTERNS = [
  /今度は/,
  /今回は/,
  /に変えて/,
  /に切り替え/,
  /に変更して/,
  /に絞って/,
  /だけに/,
  /のみに/,
  /に限定/,
];

function detectOperationType(text: string): OperationType {
  for (const p of RESET_PATTERNS) {
    if (p.test(text)) return "reset";
  }
  for (const p of REMOVE_PATTERNS) {
    if (p.test(text)) return "remove";
  }
  for (const p of OVERWRITE_PATTERNS) {
    if (p.test(text)) return "overwrite";
  }
  return "add";
}

// ── 年齢解釈 ─────────────────────────────────────────────────────
function parseAgeRange(
  text: string,
  ambiguities: string[],
  assumed: string[]
): { min: number; max: number } | undefined {
  // 「若い / 若者」
  if (/若い|若者|ヤング/.test(text)) {
    ambiguities.push("「若い」は曖昧な表現です");
    assumed.push("「若い」→ 18〜29歳と解釈");
    return { min: 18, max: 29 };
  }

  // 「シニア / 高齢 / お年寄り」
  if (/シニア|高齢|お年寄り|老人/.test(text)) {
    ambiguities.push("「シニア」は曖昧な表現です");
    assumed.push("「シニア」→ 60〜79歳と解釈");
    return { min: 60, max: 79 };
  }

  // 「ミドル / 中年」
  if (/ミドル|中年/.test(text)) {
    ambiguities.push("「ミドル」は曖昧な表現です");
    assumed.push("「ミドル」→ 40〜54歳と解釈");
    return { min: 40, max: 54 };
  }

  // 「X代」
  const decadeMatch = text.match(/(\d+)代/);
  if (decadeMatch) {
    const decade = parseInt(decadeMatch[1], 10);
    if (decade >= 10 && decade <= 70) {
      return { min: decade, max: decade + 9 };
    }
  }

  // 「X歳〜Yまで / X歳からY歳」
  const rangeMatch = text.match(/(\d+)\s*歳?\s*[〜~から]\s*(\d+)\s*歳/);
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1], 10),
      max: parseInt(rangeMatch[2], 10),
    };
  }

  // 「X歳以上」
  const overMatch = text.match(/(\d+)\s*歳\s*以上/);
  if (overMatch) {
    return { min: parseInt(overMatch[1], 10), max: 79 };
  }

  // 「X歳以下」
  const underMatch = text.match(/(\d+)\s*歳\s*以下/);
  if (underMatch) {
    return { min: 15, max: parseInt(underMatch[1], 10) };
  }

  return undefined;
}

// ── 性別解釈 ─────────────────────────────────────────────────────
function parseGenders(text: string): string[] {
  const genders: string[] = [];
  if (/女性|女の人|レディ/.test(text)) genders.push("female");
  if (/男性|男の人|メンズ/.test(text)) genders.push("male");
  if (/ノンバイナリ|その他の性別/.test(text)) genders.push("other");
  return genders;
}

// ── 地域解釈 ─────────────────────────────────────────────────────
const AREA_MAP: Array<{ pattern: RegExp; value: string }> = [
  { pattern: /東京/, value: "東京都" },
  { pattern: /神奈川|横浜|川崎/, value: "神奈川県" },
  { pattern: /大阪/, value: "大阪府" },
  { pattern: /愛知|名古屋/, value: "愛知県" },
  { pattern: /埼玉/, value: "埼玉県" },
  { pattern: /千葉/, value: "千葉県" },
  { pattern: /兵庫|神戸/, value: "兵庫県" },
  { pattern: /福岡/, value: "福岡県" },
  { pattern: /北海道|札幌/, value: "北海道" },
  { pattern: /静岡/, value: "静岡県" },
  { pattern: /茨城/, value: "茨城県" },
  { pattern: /京都/, value: "京都府" },
  { pattern: /広島/, value: "広島県" },
  { pattern: /宮城|仙台/, value: "宮城県" },
  { pattern: /新潟/, value: "新潟県" },
  { pattern: /長野/, value: "長野県" },
  { pattern: /岡山/, value: "岡山県" },
  { pattern: /栃木/, value: "栃木県" },
  { pattern: /群馬/, value: "群馬県" },
];

const REGION_MAP: Array<{ pattern: RegExp; values: string[] }> = [
  {
    pattern: /首都圏|関東/,
    values: ["東京都", "神奈川県", "埼玉県", "千葉県", "茨城県", "栃木県", "群馬県"],
  },
  {
    pattern: /関西|近畿/,
    values: ["大阪府", "兵庫県", "京都府"],
  },
  {
    pattern: /中部|東海/,
    values: ["愛知県", "静岡県"],
  },
  {
    pattern: /九州/,
    values: ["福岡県"],
  },
];

function parseAreas(text: string, ambiguities: string[], assumed: string[]): string[] {
  const areas: string[] = [];

  for (const region of REGION_MAP) {
    if (region.pattern.test(text)) {
      ambiguities.push(`広域地名が含まれています`);
      assumed.push(`「${text.match(region.pattern)?.[0]}」→ ${region.values.join("・")}と解釈`);
      areas.push(...region.values);
    }
  }

  for (const area of AREA_MAP) {
    if (area.pattern.test(text) && !areas.includes(area.value)) {
      areas.push(area.value);
    }
  }

  return [...new Set(areas)];
}

// ── 世帯構成解釈 ─────────────────────────────────────────────────
function parseHouseholds(
  text: string,
  ambiguities: string[],
  assumed: string[]
): string[] {
  const households: string[] = [];

  if (/子育て世帯|子供がいる|育児中|子持ち/.test(text)) {
    ambiguities.push("「子育て世帯」の世帯構成が曖昧です");
    assumed.push("「子育て世帯」→「夫婦+子供」「ひとり親+子供」と解釈");
    households.push("夫婦+子供", "ひとり親+子供");
  }
  if (/単身|一人暮らし|ひとり暮らし/.test(text)) {
    households.push("単身");
  }
  if (/夫婦のみ|DINKS|ディンクス|共働き夫婦/.test(text)) {
    households.push("夫婦のみ");
  }
  if (/三世代|祖父母/.test(text)) {
    households.push("三世代同居");
  }
  if (/シェアハウス/.test(text)) {
    households.push("シェアハウス");
  }

  return [...new Set(households)];
}

// ── 年収解釈 ─────────────────────────────────────────────────────
const INCOME_ALIASES: Array<{
  pattern: RegExp;
  values: string[];
  label: string;
}> = [
  {
    pattern: /高収入|高所得|富裕層|高年収/,
    values: ["800〜1000万円", "1000万円以上"],
    label: "「高収入」→ 800万円以上と解釈",
  },
  {
    pattern: /低収入|低所得|低年収/,
    values: ["200万円未満", "200〜400万円"],
    label: "「低収入」→ 400万円未満と解釈",
  },
  {
    pattern: /中収入|中所得|中間層/,
    values: ["400〜600万円", "600〜800万円"],
    label: "「中収入」→ 400〜800万円と解釈",
  },
  {
    pattern: /800万円?以上/,
    values: ["800〜1000万円", "1000万円以上"],
    label: "年収800万円以上",
  },
  {
    pattern: /1000万円?以上/,
    values: ["1000万円以上"],
    label: "年収1000万円以上",
  },
  {
    pattern: /600万円?以上/,
    values: ["600〜800万円", "800〜1000万円", "1000万円以上"],
    label: "年収600万円以上",
  },
  {
    pattern: /400万円?未満|400万円?以下/,
    values: ["200万円未満", "200〜400万円"],
    label: "年収400万円未満",
  },
];

function parseIncomeBands(
  text: string,
  ambiguities: string[],
  assumed: string[]
): string[] {
  const bands: string[] = [];
  for (const alias of INCOME_ALIASES) {
    if (alias.pattern.test(text)) {
      if (alias.label.includes("→")) {
        ambiguities.push(`曖昧な年収表現が含まれています`);
        assumed.push(alias.label);
      }
      bands.push(...alias.values);
    }
  }
  return [...new Set(bands)];
}

// ── チャネル解釈 ─────────────────────────────────────────────────
const CHANNEL_MAP: Array<{ pattern: RegExp; value: string }> = [
  { pattern: /Instagram|インスタ/, value: "Instagram" },
  { pattern: /Twitter|X（旧Twitter）|ツイッター/, value: "Twitter/X" },
  { pattern: /YouTube|ユーチューブ/, value: "YouTube" },
  { pattern: /TikTok|ティックトック/, value: "TikTok" },
  { pattern: /テレビ|TV|地上波/, value: "テレビ" },
  { pattern: /新聞|雑誌|紙メディア/, value: "新聞・雑誌" },
  { pattern: /口コミ|レビューサイト|食べログ|ぐるなび/, value: "口コミサイト" },
  { pattern: /検索|Google|Yahoo|SEO/, value: "検索エンジン" },
  { pattern: /友人|知人|紹介|口頭/, value: "友人・知人" },
  { pattern: /店頭|店舗|リアル店舗/, value: "店頭" },
  { pattern: /SNS/, value: "Instagram" }, // SNS全般はInstagramを代表に
];

function parseChannels(text: string): string[] {
  const channels: string[] = [];
  for (const item of CHANNEL_MAP) {
    if (item.pattern.test(text) && !channels.includes(item.value)) {
      channels.push(item.value);
    }
  }
  return channels;
}

// ── ブランド志向解釈 ──────────────────────────────────────────────
function parseBrandPreference(
  text: string,
  ambiguities: string[],
  assumed: string[]
): string[] {
  const brands: string[] = [];

  if (/ブランド志向が高い|ハイブランド|ラグジュアリー|高級ブランド/.test(text)) {
    assumed.push("「ブランド志向が高い」→「ハイブランド志向」と解釈");
    brands.push("ハイブランド志向");
  }
  if (/コスパ|節約|安さ重視|ノーブランド/.test(text)) {
    brands.push("ノーブランド・コスパ志向");
  }
  if (/国産|日本製|メイドインジャパン/.test(text)) {
    brands.push("日本製・国内ブランド志向");
  }
  if (/海外ブランド|外国ブランド/.test(text)) {
    brands.push("海外ブランド志向");
  }

  if (brands.length === 0 && /ブランド/.test(text)) {
    ambiguities.push("「ブランド」の種類が特定できませんでした");
  }

  return brands;
}

// ── 職業解釈 ─────────────────────────────────────────────────────
function parseOccupations(text: string): string[] {
  const occupations: string[] = [];
  if (/会社員|サラリーマン|OL/.test(text)) {
    occupations.push("会社員（正社員）", "会社員（契約・派遣）");
  }
  if (/正社員/.test(text)) occupations.push("会社員（正社員）");
  if (/派遣|契約社員/.test(text)) occupations.push("会社員（契約・派遣）");
  if (/自営業|フリーランス|個人事業/.test(text)) {
    occupations.push("自営業・フリーランス");
  }
  if (/公務員/.test(text)) occupations.push("公務員");
  if (/専業主婦|専業主夫|主婦|主夫/.test(text)) {
    occupations.push("専業主婦・主夫");
  }
  if (/パート|アルバイト|バイト/.test(text)) {
    occupations.push("パート・アルバイト");
  }
  if (/学生|大学生|高校生/.test(text)) occupations.push("学生");
  return [...new Set(occupations)];
}

// ── 興味・関心解釈 ────────────────────────────────────────────────
const INTEREST_MAP: Array<{ pattern: RegExp; value: string }> = [
  { pattern: /グルメ|料理|食べ物|食事/, value: "グルメ・料理" },
  { pattern: /旅行|トラベル|観光/, value: "旅行" },
  { pattern: /ファッション|おしゃれ|服/, value: "ファッション" },
  { pattern: /美容|スキンケア|コスメ|化粧/, value: "美容・スキンケア" },
  { pattern: /フィットネス|健康|ジム|運動|スポーツ全般/, value: "フィットネス・健康" },
  { pattern: /映画|ドラマ|動画|エンタメ/, value: "エンタメ（映画・ドラマ）" },
  { pattern: /音楽|ライブ|コンサート/, value: "音楽" },
  { pattern: /読書|勉強|教養|本/, value: "読書・教養" },
  { pattern: /テクノロジー|ガジェット|IT|テック/, value: "テクノロジー・ガジェット" },
  { pattern: /育児|子育て|教育|子供/, value: "育児・教育" },
  { pattern: /DIY|インテリア|家具|部屋/, value: "DIY・インテリア" },
  { pattern: /スポーツ観戦|野球|サッカー|観戦/, value: "スポーツ観戦" },
  { pattern: /投資|資産|株|FX|お金/, value: "投資・資産形成" },
  { pattern: /ゲーム|eスポーツ/, value: "ゲーム" },
  { pattern: /アウトドア|キャンプ|登山|釣り/, value: "アウトドア" },
];

function parseInterests(text: string): string[] {
  const interests: string[] = [];
  for (const item of INTEREST_MAP) {
    if (item.pattern.test(text)) interests.push(item.value);
  }
  return [...new Set(interests)];
}

// ── ライフステージ解釈 ───────────────────────────────────────────
function parseLifeStages(
  text: string,
  ambiguities: string[],
  assumed: string[]
): string[] {
  const stages: string[] = [];
  if (/子育て中|育児中|子供がいる/.test(text)) {
    stages.push(
      "子育て中（就学前）",
      "子育て中（小中学生）",
      "子育て中（高校生以上）"
    );
  }
  if (/独身|シングル/.test(text)) {
    stages.push("独身（若年）", "独身（中年）");
  }
  if (/DINKS|ディンクス|共働き夫婦/.test(text)) {
    stages.push("DINKS");
  }
  if (/シニア|老後|定年/.test(text)) {
    stages.push("シニア", "子供独立後");
  }
  if (/学生/.test(text)) {
    stages.push("学生");
  }
  return [...new Set(stages)];
}

// ── メイン解析関数（ルールベース）────────────────────────────────
export function parseNaturalText(text: string): ParsedConditionResult {
  const ambiguities: string[] = [];
  const assumed: string[] = [];
  const normalizedText = text.trim().replace(/\s+/g, " ");

  const operationType = detectOperationType(normalizedText);

  if (operationType === "reset") {
    return {
      operationType: "reset",
      extractedCondition: {},
      normalizedText,
      ambiguities: [],
      assumedInterpretation: ["条件をリセットします"],
    };
  }

  const extractedCondition: Partial<SimulationCondition> = {};

  const ageRange = parseAgeRange(normalizedText, ambiguities, assumed);
  if (ageRange) extractedCondition.ageRange = ageRange;

  const genders = parseGenders(normalizedText);
  if (genders.length > 0) extractedCondition.genders = genders;

  const areas = parseAreas(normalizedText, ambiguities, assumed);
  if (areas.length > 0) extractedCondition.areas = areas;

  const households = parseHouseholds(normalizedText, ambiguities, assumed);
  if (households.length > 0) extractedCondition.households = households;

  const occupations = parseOccupations(normalizedText);
  if (occupations.length > 0) extractedCondition.occupations = occupations;

  const incomeBands = parseIncomeBands(normalizedText, ambiguities, assumed);
  if (incomeBands.length > 0) extractedCondition.incomeBands = incomeBands;

  const channels = parseChannels(normalizedText);
  if (channels.length > 0) extractedCondition.channels = channels;

  const brandPrefs = parseBrandPreference(normalizedText, ambiguities, assumed);
  if (brandPrefs.length > 0) extractedCondition.brandPreference = brandPrefs;

  const interests = parseInterests(normalizedText);
  if (interests.length > 0) extractedCondition.interests = interests;

  const lifeStages = parseLifeStages(normalizedText, ambiguities, assumed);
  if (lifeStages.length > 0) extractedCondition.lifeStages = lifeStages;

  return {
    operationType,
    extractedCondition,
    normalizedText,
    ambiguities,
    assumedInterpretation: assumed,
  };
}

// ── 条件を人間が読める文字列にフォーマット ────────────────────────
export function formatConditionAsText(condition: SimulationCondition): string {
  const parts: string[] = [];

  if (condition.ageRange) {
    parts.push(`年齢: ${condition.ageRange.min}〜${condition.ageRange.max}歳`);
  }
  if (condition.genders?.length) {
    const labels: Record<string, string> = {
      male: "男性",
      female: "女性",
      other: "その他",
    };
    parts.push(`性別: ${condition.genders.map((g) => labels[g] ?? g).join("・")}`);
  }
  if (condition.areas?.length) {
    parts.push(`地域: ${condition.areas.join("・")}`);
  }
  if (condition.households?.length) {
    parts.push(`世帯: ${condition.households.join("・")}`);
  }
  if (condition.occupations?.length) {
    parts.push(`職業: ${condition.occupations.join("・")}`);
  }
  if (condition.incomeBands?.length) {
    parts.push(`年収: ${condition.incomeBands.join("・")}`);
  }
  if (condition.educationBands?.length) {
    parts.push(`学歴: ${condition.educationBands.join("・")}`);
  }
  if (condition.lifeStages?.length) {
    parts.push(`ライフステージ: ${condition.lifeStages.join("・")}`);
  }
  if (condition.interests?.length) {
    parts.push(`関心: ${condition.interests.join("・")}`);
  }
  if (condition.channels?.length) {
    parts.push(`チャネル: ${condition.channels.join("・")}`);
  }
  if (condition.incomeBands?.length) {
    parts.push(`年収: ${condition.incomeBands.join("・")}`);
  }
  if (condition.brandPreference?.length) {
    parts.push(`ブランド志向: ${condition.brandPreference.join("・")}`);
  }
  if (condition.priceSensitivity?.length) {
    parts.push(`価格感度: ${condition.priceSensitivity.join("・")}`);
  }
  if (condition.purchaseFrequency?.length) {
    parts.push(`購入頻度: ${condition.purchaseFrequency.join("・")}`);
  }
  if (condition.categoryIntent?.length) {
    parts.push(`購買意向: ${condition.categoryIntent.join("・")}`);
  }

  return parts.length > 0 ? parts.join("、") : "（条件なし・全体）";
}
