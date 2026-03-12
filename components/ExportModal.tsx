"use client";

import { useState } from "react";
import { useSimulationStore, selectCurrentTheme } from "@/store/simulationStore";
import {
  generateMarkdown,
  generatePDFHTML,
  generatePPTX,
} from "@/lib/exportEngine";
import type { ExportFormat } from "@/types/export";
import type { ExportContext } from "@/lib/exportEngine";

const FORMAT_OPTIONS: Array<{ value: ExportFormat; label: string; desc: string; icon: string }> = [
  { value: "md", label: "Markdown", desc: ".md ファイル／テキスト形式", icon: "M" },
  { value: "pdf", label: "PDF スライド", desc: "10枚固定スライド構成（印刷用）", icon: "P" },
  { value: "pptx", label: "PowerPoint", desc: ".pptx 編集可能なスライド", icon: "W" },
];

export function ExportModal() {
  const closeExportModal = useSimulationStore((s) => s.closeExportModal);
  const currentResult = useSimulationStore((s) => s.currentResult);
  const currentCondition = useSimulationStore((s) => s.currentCondition);
  const previousResult = useSimulationStore((s) => s.previousResult);
  const basePopulationResult = useSimulationStore((s) => s.basePopulationResult);
  const currentTheme = useSimulationStore(selectCurrentTheme);
  const themes = useSimulationStore((s) => s.themes);
  const recommendations = useSimulationStore((s) => s.recommendations);

  const [format, setFormat] = useState<ExportFormat>("md");
  const [fileName, setFileName] = useState(
    currentTheme?.title
      ? `${currentTheme.title.slice(0, 30)}_report`
      : "simulation_report"
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentResult || !basePopulationResult) return null;

  const ctx: ExportContext = {
    currentResult,
    currentCondition,
    previousResult,
    baseResult: basePopulationResult,
    currentTheme,
    themes,
    recommendations,
    payload: {
      format,
      scope: "current",
      fileName: format === "pptx" ? `${fileName}.pptx` : `${fileName}.${format}`,
      sections: [],
    },
  };

  async function handleExport() {
    setIsGenerating(true);
    setError(null);

    try {
      if (format === "md") {
        const md = generateMarkdown(ctx);
        downloadText(md, `${fileName}.md`, "text/markdown");
      } else if (format === "pdf") {
        const html = generatePDFHTML(ctx);
        openPrintWindow(html);
      } else if (format === "pptx") {
        await generatePPTX({ ...ctx, payload: { ...ctx.payload, fileName: `${fileName}.pptx` } });
      }
      closeExportModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "出力に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={closeExportModal} />

      <div className="relative z-10 w-full max-w-lg bg-gray-900 border border-gray-700 rounded-xl shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white">レポート出力</h2>
          <button
            onClick={closeExportModal}
            className="text-gray-500 hover:text-white transition-colors text-lg"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* 出力形式 */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400">出力形式</label>
            <div className="grid grid-cols-3 gap-2">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormat(opt.value)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    format === opt.value
                      ? "border-blue-600 bg-blue-900/30 text-blue-300"
                      : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  <div className={`text-lg font-bold mb-1 ${format === opt.value ? "text-blue-400" : "text-gray-500"}`}>
                    {opt.icon}
                  </div>
                  <div className="text-xs font-semibold">{opt.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-tight">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ファイル名 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">ファイル名</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none text-sm text-gray-100 transition-colors"
              />
              <span className="text-sm text-gray-600 flex-shrink-0">
                .{format === "pptx" ? "pptx" : format}
              </span>
            </div>
          </div>

          {/* 含まれるコンテンツのサマリー */}
          <div className="bg-gray-800/50 rounded-lg px-4 py-3 text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-400 mb-1.5">含まれる内容</p>
            {[
              currentTheme && `テーマ: ${currentTheme.title}`,
              `対象人数: ${currentResult.totalMatched.toLocaleString()}人 (${(currentResult.ratioToPopulation * 100).toFixed(1)}%)`,
              "属性構成・行動価値観傾向",
              previousResult ? "前回との差分" : "前回差分: なし（初回実行）",
              "初回全体との差分",
              `示唆: マーケ ${currentResult.marketingInsights.length}件 / プロダクト ${currentResult.productInsights.length}件`,
              recommendations.length > 0 && `次の分析提案: ${recommendations.length}件`,
            ]
              .filter(Boolean)
              .map((item, i) => (
                <p key={i}>• {item}</p>
              ))}
          </div>

          {/* PDF 注意書き */}
          {format === "pdf" && (
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg px-4 py-3 text-xs text-yellow-400/90">
              印刷ダイアログが開きます。「PDF に保存」を選択してください。
            </div>
          )}

          {/* エラー */}
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-800">
          <button
            onClick={closeExportModal}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleExport}
            disabled={isGenerating || !fileName.trim()}
            className="px-6 py-2 text-sm font-medium rounded-lg bg-blue-700 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
          >
            {isGenerating ? (
              <span className="animate-pulse">生成中…</span>
            ) : (
              "出力する"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ダウンロードユーティリティ ────────────────────────────────────
function downloadText(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function openPrintWindow(html: string) {
  const win = window.open("", "_blank");
  if (!win) {
    throw new Error("ポップアップがブロックされました。ブラウザの設定を確認してください。");
  }
  win.document.write(html);
  win.document.close();
  // DOMが描画されてから印刷ダイアログを開く
  win.onload = () => {
    setTimeout(() => {
      win.print();
    }, 500);
  };
}
