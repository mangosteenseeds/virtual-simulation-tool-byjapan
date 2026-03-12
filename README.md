# 仮想人口シミュレーター

日本人口を1万人に縮小した仮想母集団を用い、自然文で条件を変えながら
再集計・差分比較・テーマ管理・深掘りレコメンド・資料出力まで行える
大規模リサーチシミュレーションアプリ。

## 主な機能

| 機能 | 説明 |
|------|------|
| 1万人仮想母集団 | seed固定・再現性100%・17属性 |
| 自然文条件入力 | ルールベース解釈（LLM不要） |
| 条件追加/上書き/削除/リセット | 操作種別を自動判定 |
| リアルタイム再集計 | 条件変更のたびに即座に集計 |
| 前回/初回との差分比較 | ±5pt以上の変化を自動ハイライト |
| 親子テーマ管理 | 階層構造・記憶あり/なしモード |
| 深掘りレコメンド | 深掘り/比較/横展開の3件自動生成 |
| Markdown出力 | 全14セクションをテキスト出力 |
| PDFスライド出力 | 10枚固定構成・ブラウザ印刷 |
| PowerPoint出力 | .pptx 編集可能スライド |

## セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/mangosteenseeds/virtual-simulation-tool-byjapan.git
cd virtual-simulation-tool-byjapan

# 依存パッケージをインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで `http://localhost:3000` を開き、「シミュレーション開始」をクリックします。

## 使い方

### 1. 条件入力

入力欄に日本語で条件を入力して Enter を押すか「実行」をクリックします。

```
30代女性で東京在住
年収800万円以上でブランド志向が高い人
子育て世帯でInstagramをよく見る層
```

入力中にリアルタイムでパースプレビューが表示されます。

### 2. 操作種別

| 入力例 | 操作種別 | 説明 |
|--------|----------|------|
| `30代女性で東京在住` | 追加 | 既存条件に加算 |
| `今度は男性にして` | 上書き | 性別を男性に差し替え |
| `東京条件は外して` | 削除 | 東京の条件のみ除去 |
| `最初からやり直し` | リセット | 全条件をクリア |

### 3. テーマ管理

「テーマ管理」タブから新規テーマを作成できます。

- **記憶あり**: 親テーマの条件・示唆を引き継いで分析
- **記憶なし**: 条件をリセットして独立した視点で分析

テーマは親子構造で管理でき、切り替えると条件と結果が復元されます。

### 4. 深掘りレコメンド

集計結果の下に最大3件のレコメンドが自動表示されます。

| タイプ | 内容 |
|--------|------|
| 深掘り | 現在の最多セグメントに絞り込む |
| 比較 | 現在条件の対になるセグメントと比較 |
| 横展開 | 関連する別の切り口で分析 |

「この分析を実行 →」をクリックするとワンクリックで派生分析を開始します。

### 5. レポート出力

右上の「↓ 出力」ボタンをクリックして形式を選択します。

| 形式 | 説明 |
|------|------|
| Markdown | .md ファイルをダウンロード |
| PDF | 印刷ダイアログを開く（「PDFに保存」を選択） |
| PowerPoint | .pptx ファイルをダウンロード |

## ディレクトリ構成

```
/app
  page.tsx                    # ランディングページ
  /simulation/page.tsx        # シミュレーション本体（3カラムレイアウト）
/components
  ChatInput.tsx               # 自然文入力・パースプレビュー
  ConditionSummary.tsx        # 現在条件チップ表示・個別削除
  ResultSummary.tsx           # 集計結果（14項目固定順）
  ComparisonPanel.tsx         # 前回/初回差分比較
  RecommendationPanel.tsx     # 深掘りレコメンド3件
  HistoryPanel.tsx            # 条件履歴（時系列）
  ThemeTreePanel.tsx          # 親子テーマツリー
  ThemeCreateModal.tsx        # テーマ作成フォーム
  MemoryModeToggle.tsx        # 記憶あり/なし切替
  InheritancePreviewModal.tsx # 引き継ぎ内容プレビュー
  ExportModal.tsx             # レポート出力モーダル
/lib
  population.ts               # 母集団生成（seed固定LCG乱数）
  filterEngine.ts             # フィルタ適用・条件マージ・集計
  diffEngine.ts               # 差分比較・上位N件抽出
  parserRules.ts              # 自然文→条件解釈（ルールベース）
  llmParser.ts                # LLM拡張パーサースタブ（任意拡張）
  insightEngine.ts            # ルールベース示唆生成
  themeEngine.ts              # テーマ作成・引き継ぎ計算・ツリー操作
  recommendationEngine.ts     # 深掘りレコメンド生成
  exportEngine.ts             # Markdown/PDF/PPTX出力
/types
  simulation.ts               # Person, SimulationCondition, SimulationResult 等
  theme.ts                    # Theme, Recommendation, MemoryMode
  export.ts                   # ExportPayload, ExportState
/store
  simulationStore.ts          # Zustand ストア
/data
  populationSeed.ts           # 母集団生成用定数・分布ウェイト
```

## 設計方針

### ルールベース優先

LLM は一切使いません（MVP）。自然文解釈・集計・差分・レコメンドはすべてルールベースで実装しています。

LLM を有効にする場合は `lib/llmParser.ts` のコメントを参照し、`NEXT_PUBLIC_LLM_ENABLED=true` を設定してください。

### 純関数分離

UIロジックと計算ロジックを完全分離しています。

- `filterPeople` / `runSimulation` — 純関数、副作用なし
- `compareResults` — 純関数、副作用なし
- `parseNaturalText` — 純関数、副作用なし
- `generateRecommendations` — 純関数、副作用なし

### seed固定の再現性

`data/populationSeed.ts` で `RANDOM_SEED = 42` を固定。
LCG（線形合同法）で毎回同一の10,000人を生成します。

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript (strict mode)
- **スタイリング**: Tailwind CSS v4
- **状態管理**: Zustand
- **PowerPoint生成**: pptxgenjs
- **LLM（任意）**: Anthropic Claude API（無効時はルールベースにフォールバック）

## 環境変数（任意）

```env
# LLM拡張パーサーを有効にする場合（任意）
NEXT_PUBLIC_LLM_ENABLED=true
ANTHROPIC_API_KEY=sk-ant-...
```

設定しなくても全機能が動作します。

## ライセンス

MIT
