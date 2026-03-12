import Link from "next/link";

const FEATURES = [
  {
    icon: "👥",
    title: "1万人の仮想母集団",
    desc: "seed固定で再現性100%。年齢・性別・地域・年収・ライフステージなど17属性を持つ日本人口を縮小したデータセット。",
  },
  {
    icon: "💬",
    title: "自然文で条件変更",
    desc: "「30代女性で東京在住」「今度は男性にして」「最初からやり直し」など日本語で直接指示。ルールベースで即時解釈。",
  },
  {
    icon: "📊",
    title: "リアルタイム再集計",
    desc: "条件変更のたびに即座に再集計。前回との差分・初回全体との差分をセクション別に自動比較。",
  },
  {
    icon: "🌳",
    title: "親子テーマ管理",
    desc: "分析テーマを階層構造で管理。記憶あり/なしモードで条件・示唆の引き継ぎを細かく制御。",
  },
  {
    icon: "💡",
    title: "深掘りレコメンド",
    desc: "集計結果から自動的に「深掘り・比較・横展開」3タイプのレコメンドを生成。ワンクリックで派生分析を開始。",
  },
  {
    icon: "📄",
    title: "3形式で出力",
    desc: "Markdown / PDFスライド（10枚）/ PowerPoint（.pptx）の3形式でレポートを出力。数値は集計結果と完全一致。",
  },
];

const SAMPLES = [
  { text: "30代女性で東京在住", type: "条件追加" },
  { text: "年収800万円以上でブランド志向が高い人", type: "条件追加" },
  { text: "子育て世帯でInstagramをよく見る層", type: "条件追加" },
  { text: "今度は男性も含めて比較", type: "上書き" },
  { text: "東京条件は外して", type: "条件削除" },
  { text: "最初からやり直し", type: "リセット" },
];

const OP_COLOR: Record<string, string> = {
  "条件追加": "text-green-400 bg-green-900/20 border-green-800",
  "上書き": "text-yellow-400 bg-yellow-900/20 border-yellow-800",
  "条件削除": "text-red-400 bg-red-900/20 border-red-800",
  "リセット": "text-gray-400 bg-gray-800 border-gray-700",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      {/* ── ヒーロー ── */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center space-y-6">
        <div className="inline-block text-xs font-medium px-3 py-1 rounded-full border border-blue-800 text-blue-400 bg-blue-900/20">
          仮想母集団 10,000人 — LLM不要・ルールベースで即時動作
        </div>
        <h1 className="text-4xl font-bold tracking-tight leading-tight">
          仮想人口シミュレーター
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
          日本人口を1万人に縮小した仮想母集団を使い、自然文で条件を変えながら
          再集計・差分比較・テーマ管理・深掘りレコメンドを行える
          大規模リサーチシミュレーションアプリ。
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link
            href="/simulation"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold text-base transition-colors shadow-lg"
          >
            シミュレーション開始
          </Link>
          <a
            href="https://github.com/mangosteenseeds/virtual-simulation-tool-byjapan"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 font-medium text-base transition-colors border border-gray-700"
          >
            GitHub
          </a>
        </div>
      </section>

      {/* ── 機能一覧 ── */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-center text-sm font-semibold text-gray-500 uppercase tracking-widest mb-8">
          主な機能
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-2.5 hover:border-gray-700 transition-colors"
            >
              <div className="text-2xl">{f.icon}</div>
              <h3 className="font-semibold text-white text-sm">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── サンプル入力 ── */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <h2 className="text-center text-sm font-semibold text-gray-500 uppercase tracking-widest mb-8">
          サンプル入力
        </h2>
        <div className="space-y-2.5">
          {SAMPLES.map((s) => (
            <div
              key={s.text}
              className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl px-5 py-3"
            >
              <span
                className={`text-xs px-2.5 py-1 rounded-full border font-medium flex-shrink-0 ${OP_COLOR[s.type] ?? ""}`}
              >
                {s.type}
              </span>
              <span className="text-sm text-gray-300 font-mono">{s.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 技術スタック ── */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-center text-sm font-semibold text-gray-500 uppercase tracking-widest mb-6">
          技術スタック
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            "Next.js 15", "TypeScript", "Tailwind CSS", "Zustand",
            "pptxgenjs", "ルールベースパーサー", "LLM拡張対応（任意）",
          ].map((t) => (
            <span
              key={t}
              className="text-xs px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-gray-400"
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ── フッター ── */}
      <footer className="border-t border-gray-800 py-8 text-center text-xs text-gray-600">
        仮想人口シミュレーター — Built with Claude Code
      </footer>
    </main>
  );
}
