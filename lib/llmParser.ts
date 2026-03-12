// ── LLM拡張パーサー（将来拡張用スタブ）────────────────────────────
//
// このファイルはルールベースの parserRules.ts を LLM で拡張するための
// インターフェースを定義します。
//
// MVP では LLM 連携なしで動作します（ルールベースのみ）。
// LLM を有効にするには:
//   1. NEXT_PUBLIC_LLM_ENABLED=true を .env.local に設定
//   2. Claude API キーを ANTHROPIC_API_KEY に設定
//   3. /app/api/parse/route.ts を実装（下記スキーマに従う）
//
// LLM の役割は「条件解釈の補完」のみです。
// 数値計算・集計・差分比較は常にルールベースで処理します。

import type { ParsedConditionResult, SimulationCondition } from "@/types/simulation";
import { parseNaturalText } from "@/lib/parserRules";

// LLM連携が有効かどうか（環境変数で切替）
const LLM_ENABLED =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_LLM_ENABLED === "true";

// ── LLM APIレスポンスのスキーマ ──────────────────────────────────
export interface LLMParseResponse {
  operationType: "add" | "overwrite" | "remove" | "reset";
  extractedCondition: Partial<SimulationCondition>;
  normalizedText: string;
  ambiguities: string[];
  assumedInterpretation: string[];
}

// ── LLMパーサー（フォールバック付き）────────────────────────────
export async function parseWithLLM(text: string): Promise<ParsedConditionResult> {
  if (!LLM_ENABLED) {
    // LLM無効時はルールベースにフォールバック
    return parseNaturalText(text);
  }

  try {
    const response = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(5000), // 5秒タイムアウト
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data: LLMParseResponse = await response.json();
    return {
      operationType: data.operationType,
      extractedCondition: data.extractedCondition,
      normalizedText: data.normalizedText,
      ambiguities: data.ambiguities,
      assumedInterpretation: data.assumedInterpretation,
    };
  } catch {
    // LLM失敗時はルールベースにフォールバック（処理を止めない）
    console.warn("[LLMParser] LLM parse failed, falling back to rule-based parser");
    const fallback = parseNaturalText(text);
    return {
      ...fallback,
      ambiguities: [...fallback.ambiguities, "（LLM解釈失敗のためルールベースで処理しました）"],
    };
  }
}

// ── LLM有効状態の確認 ────────────────────────────────────────────
export function isLLMEnabled(): boolean {
  return LLM_ENABLED;
}

// ── 将来実装: /app/api/parse/route.ts のサンプル ─────────────────
//
// export async function POST(req: Request) {
//   const { text } = await req.json();
//   const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
//
//   const message = await anthropic.messages.create({
//     model: "claude-opus-4-6",
//     max_tokens: 512,
//     system: `あなたは日本語の条件テキストを解析するアシスタントです。
// 与えられたテキストを以下のJSONスキーマで返してください:
// {
//   operationType: "add" | "overwrite" | "remove" | "reset",
//   extractedCondition: { /* SimulationCondition の部分型 */ },
//   normalizedText: string,
//   ambiguities: string[],
//   assumedInterpretation: string[]
// }`,
//     messages: [{ role: "user", content: text }],
//   });
//
//   const content = message.content[0];
//   if (content.type !== "text") return Response.json({ error: "Invalid response" }, { status: 500 });
//   return Response.json(JSON.parse(content.text));
// }
