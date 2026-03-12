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

export function ChatInput() {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const parserPreview = useSimulationStore((s) => s.parserPreview);
  const loadingState = useSimulationStore((s) => s.loadingState);
  const previewParse = useSimulationStore((s) => s.previewParse);
  const clearParserPreview = useSimulationStore((s) => s.clearParserPreview);
  const applyParsedCondition = useSimulationStore((s) => s.applyParsedCondition);

  const isLoading = loadingState === "filtering" || loadingState === "aggregating";

  // テキスト変化でリアルタイムプレビュー
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

    const parsed = parseNaturalText(trimmed);
    applyParsedCondition(parsed, trimmed);
    setText("");
    clearParserPreview();
  }

  function handleSample(sample: string) {
    setText(sample);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const preview = parserPreview;
  const opInfo = preview ? OP_LABEL[preview.operationType] : null;

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
        <div className="rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 text-xs space-y-1.5">
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

          {Object.keys(preview.extractedCondition).length === 0 &&
            preview.operationType !== "reset" && (
              <div className="text-red-400">
                条件を抽出できませんでした。別の表現を試してください。
              </div>
            )}
        </div>
      )}

      {/* テキスト入力 */}
      <div className="flex gap-3">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="例：30代女性で東京在住、子育て世帯でInstagramをよく見る層…"
          rows={2}
          disabled={isLoading}
          className="flex-1 resize-none rounded-lg bg-gray-900 border border-gray-700 focus:border-blue-500 focus:outline-none px-4 py-3 text-sm text-gray-100 placeholder-gray-600 disabled:opacity-50 transition-colors"
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

      <p className="text-xs text-gray-600">
        Enter で実行 / Shift+Enter で改行
      </p>
    </div>
  );
}
