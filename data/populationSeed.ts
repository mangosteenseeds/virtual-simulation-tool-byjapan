// 仮想母集団の生成に使う定数・分布テーブル
// seed固定で同一結果を保証する

export const POPULATION_SIZE = 10000;
export const RANDOM_SEED = 42;

export const AREAS = [
  "東京都",
  "神奈川県",
  "大阪府",
  "愛知県",
  "埼玉県",
  "千葉県",
  "兵庫県",
  "福岡県",
  "北海道",
  "静岡県",
  "茨城県",
  "京都府",
  "広島県",
  "宮城県",
  "新潟県",
  "長野県",
  "岡山県",
  "栃木県",
  "群馬県",
  "その他",
];

// 各エリアの相対ウェイト（実人口比に近似）
export const AREA_WEIGHTS = [
  14, 9, 9, 7, 7, 6, 5, 5, 5, 4, 3, 3, 3, 2, 2, 2, 2, 2, 2, 8,
];

export const GENDERS: Array<"male" | "female" | "other"> = [
  "male",
  "female",
  "other",
];
export const GENDER_WEIGHTS = [49, 50, 1];

export const HOUSEHOLDS = [
  "単身",
  "夫婦のみ",
  "夫婦+子供",
  "ひとり親+子供",
  "三世代同居",
  "シェアハウス",
  "その他",
];
export const HOUSEHOLD_WEIGHTS = [28, 22, 30, 8, 6, 3, 3];

export const OCCUPATIONS = [
  "会社員（正社員）",
  "会社員（契約・派遣）",
  "自営業・フリーランス",
  "公務員",
  "専業主婦・主夫",
  "パート・アルバイト",
  "学生",
  "無職・求職中",
  "その他",
];
export const OCCUPATION_WEIGHTS = [35, 12, 8, 6, 8, 12, 8, 6, 5];

export const INCOME_BANDS = [
  "200万円未満",
  "200〜400万円",
  "400〜600万円",
  "600〜800万円",
  "800〜1000万円",
  "1000万円以上",
];
export const INCOME_WEIGHTS = [12, 25, 28, 18, 10, 7];

export const EDUCATION_BANDS = [
  "中学・高校卒",
  "専門学校・短大卒",
  "大学卒",
  "大学院卒",
];
export const EDUCATION_WEIGHTS = [35, 20, 38, 7];

export const LIFE_STAGES = [
  "学生",
  "独身（若年）",
  "独身（中年）",
  "DINKS",
  "子育て中（就学前）",
  "子育て中（小中学生）",
  "子育て中（高校生以上）",
  "子供独立後",
  "シニア",
];
export const LIFE_STAGE_WEIGHTS = [8, 15, 10, 12, 10, 12, 8, 12, 13];

export const INTERESTS = [
  "グルメ・料理",
  "旅行",
  "ファッション",
  "美容・スキンケア",
  "フィットネス・健康",
  "エンタメ（映画・ドラマ）",
  "音楽",
  "読書・教養",
  "テクノロジー・ガジェット",
  "育児・教育",
  "DIY・インテリア",
  "スポーツ観戦",
  "投資・資産形成",
  "ゲーム",
  "アウトドア",
];

export const PURCHASE_STYLES = [
  "計画的・慎重型",
  "衝動的・感情型",
  "リサーチ重視型",
  "口コミ重視型",
  "価格比較型",
  "ブランド忠実型",
];
export const PURCHASE_STYLE_WEIGHTS = [20, 15, 25, 18, 15, 7];

export const CHANNELS = [
  "Instagram",
  "Twitter/X",
  "YouTube",
  "TikTok",
  "テレビ",
  "新聞・雑誌",
  "口コミサイト",
  "検索エンジン",
  "友人・知人",
  "店頭",
];

export const PRICE_SENSITIVITY_LEVELS = [
  "非常に高い（徹底的に安さを求める）",
  "高い（なるべく安く買いたい）",
  "普通（価格と品質のバランスを重視）",
  "低い（品質や体験が良ければ高くても可）",
  "非常に低い（価格はほぼ気にしない）",
];
export const PRICE_SENSITIVITY_WEIGHTS = [10, 25, 40, 18, 7];

export const BRAND_PREFERENCES = [
  "ハイブランド志向",
  "中価格帯ブランド志向",
  "ノーブランド・コスパ志向",
  "日本製・国内ブランド志向",
  "海外ブランド志向",
  "こだわりなし",
];
export const BRAND_PREFERENCE_WEIGHTS = [8, 30, 25, 18, 7, 12];

export const DECISION_TYPES = [
  "自分主導",
  "パートナー主導",
  "家族合議",
  "他者推薦優先",
];
export const DECISION_TYPE_WEIGHTS = [45, 20, 25, 10];

export const PURCHASE_FREQUENCIES = [
  "週複数回",
  "週1回程度",
  "月2〜3回",
  "月1回程度",
  "数ヶ月に1回",
  "年数回以下",
];
export const PURCHASE_FREQUENCY_WEIGHTS = [8, 15, 22, 25, 18, 12];

export const CATEGORY_INTENTS = [
  "食品・日用品",
  "ファッション・アパレル",
  "美容・コスメ",
  "家電・ガジェット",
  "家具・インテリア",
  "旅行・レジャー",
  "外食・グルメ",
  "教育・自己啓発",
  "フィットネス・健康食品",
  "金融・保険",
  "不動産・住宅",
  "自動車・モビリティ",
];
