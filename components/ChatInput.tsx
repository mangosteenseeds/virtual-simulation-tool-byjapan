"use client";

import { useState, useRef, useEffect } from "react";
import { useSimulationStore } from "@/store/simulationStore";
import { parseNaturalText } from "@/lib/parserRules";

const SAMPLE_INPUTS = [
  "30代女性で東京在住",
  "年収800万円以上でブランド志向が高い人",
  "子育て世帯でInstagramをよく見る層",
  "今度は男性も含めて比較",
  "最初からやり直し",
];

const OP_LABEL: Record<string, { label: string; color: string }> = {
  add: { label: "条件追加", color: "text-green-400" },
  overwrite: { label: "上書き", color: "text-yellow-400" },
  remove: { label: "条件削除", color: "text-red-400" },
  reset: { label: "リセット", color: "text-gray-400" },
};

// 条件が抽出できないときに提案するヒント
const PARSE_HINTS = [
  "年齢: 「30代」「20歳〜40歳」「若い層」「シニア」",
  "性別: 「女性」「男性」",
  "地域: 「東京在住」「関西」「首都圏」",
  "年収: 「高収入」「年収800万円以上」「低所得層」",
  "チャネル: 「Instagramをよく見る」「YouTube利用者」",
  "世帯: 「子育て世帯」「単身」「DINKS」",
  "ブランド: 「ブランド志向が高い」「コスパ重視」",
  "操作: 「今度は〜にして」「〜を外して」「最初からやり直し」",
];

export function ChatInput() {
  const [text, setText] = useState("");
  const [showHints, setShowHints] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const parserPreview = useSimulationStore((s) => s.parserPreview);
  const loadingState = useSimulationStore((s) => s.loadingState);
  const errorState = useSimulationStore((s) => s.errorState);
  const previewParse = useSimulationStore((s) => s.previewParse);
  const clearParserPreview = useSimulationStore((s) => s.clearParserPreview);
  const applyParsedCondition = useSimulationStore((s) => s.applyParsedCondition);
  const setError = useSimulationStore((s) => s.setError);

  const isLoading = loadingState === "filtering" || loadingState === "aggregating";

  // パース失敗エラーが出たときにヒントを表示
  const isParseError =
    errorState?.includes("条件を認識できませんでした") ?? false;

  // テキスト変化でリアルタイムプレビュー（300ms debounce）
  useEffect(() => {
    if (text.trim().length === 0) {
      clearParserPreview();
      return;
    }
    const id = setTimeout(() => {
      previewParse(text);
    }, 300);
    return () => clearTimeout(id);
  }, [text, previewParse, clearParserPreview]);

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setError(null);

    const parsed = parseNaturalText(trimmed);
    applyParsedCondition(parsed, trimmed);
    setText("");
    clearParserPreview();
    setShowHints(false);
  }

  function handleSample(sample: string) {
    setText(sample);
    setError(null);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    if (errorState) setError(null);
  }

  const preview = parserPreview;
  const opInfo = preview ? OP_LABEL[preview.operationType] : null;
  const cannotExtract =
    preview &&
    Object.keys(preview.extractedCondition).length === 0 &&
    preview.operationType !== "reset";

  return (
    <div className="space-y-3">
      {/* サンプルボタン */}
      <div className="flex flex-wrap gap-2">
        {SAMPLE_INPUTS.map((sample) => (
          <button
            key={sample}
            onClick={() => handleSample(sample)}
            className="text-xs px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors border border-gray-700 hover:border-gray-500"
          >
            {sample}
          </button>
        ))}
      </div>

      {/* パーサープレビュー */}
      {preview && text.trim().length > 0 && (
        <div
          className={`rounded-lg border px-4 py-3 text-xs space-y-1.5 ${
            cannotExtract
              ? "bg-red-900/20 border-red-800"
              : "bg-gray-900 border-gray-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${opInfo?.color ?? "text-gray-400"}`}>
              [{opInfo?.label ?? preview.operationType}]
            </span>
            <span className="text-gray-400">{preview.normalizedText}</span>
          </div>

          {preview.assumedInterpretation.length > 0 && (
            <div className="text-blue-400 space-y-0.5">
              {preview.assumedInterpretation.map((a, i) => (
                <div key={i}>→ {a}</div>
              ))}
            </div>
          )}

          {preview.ambiguities.length > 0 && (
            <div className="text-yellow-500 space-y-0.5">
              {preview.ambiguities.map((a, i) => (
                <div key={i}>⚠ {a}</div>
              ))}
            </div>
          )}

          {cannotExtract && (
            <div className="text-red-400">
              条件を認識できませんでした。
              <button
                onClick={() => setShowHints((v) => !v)}
                className="ml-1 underline text-red-300 hover:text-red-100"
              >
                入力ヒントを表示
              </button>
            </div>
          )}
        </div>
      )}

      {/* パース失敗ヒント（ストアのエラー or プレビューのエラー） */}
      {(isParseError || showHints) && (
        <div className="rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 text-xs space-y-2">
          <p className="text-gray-400 font-medium">入力ヒント</p>
          <div className="grid grid-cols-2 gap-1">
            {PARSE_HINTS.map((hint, i) => (
              <p key={i} className="text-gray-500 leading-relaxed">{hint}</p>
            ))}
          </div>
          <button
            onClick={() => setShowHints(false)}
            className="text-gray-600 hover:text-gray-400 text-xs"
          >
            閉じる
          </button>
        </div>
      )}

      {/* テキスト入力 */}
      <div className="flex gap-3">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="例：30代女性で東京在住、子育て世帯でInstagramをよく見る層…"
          rows={2}
          disabled={isLoading}
          className={`flex-1 resize-none rounded-lg bg-gray-900 border focus:outline-none px-4 py-3 text-sm text-gray-100 placeholder-gray-600 disabled:opacity-50 transition-colors ${
            cannotExtract
              ? "border-red-700 focus:border-red-500"
              : "border-gray-700 focus:border-blue-500"
          }`}
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          className="px-5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors flex-shrink-0"
        >
          {isLoading ? (
            <span className="animate-pulse">集計中</span>
          ) : (
            "実行"
          )}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-600">
          Enter で実行 / Shift+Enter で改行
        </p>
        <button
          onClick={() => setShowHints((v) => !v)}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          {showHints ? "ヒントを閉じる" : "入力ヒントを見る"}
        </button>
      </div>
    </div>
  );
}
