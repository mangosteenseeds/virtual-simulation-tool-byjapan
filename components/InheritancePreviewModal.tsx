"use client";

import type { Theme, MemoryMode } from "@/types/theme";
import { buildInheritance, memoryModeLabel } from "@/lib/themeEngine";

interface Props {
  parentTheme: Theme | null;
  memoryMode: MemoryMode;
  onClose: () => void;
  onConfirm: () => void;
}

export function InheritancePreviewModal({
  parentTheme,
  memoryMode,
  onClose,
  onConfirm,
}: Props) {
  const { inheritedConditions, excludedConditions, inheritedInsights } =
    buildInheritance(parentTheme, memoryMode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* モーダル本体 */}
      <div className="relative z-10 w-full max-w-lg bg-gray-900 border border-gray-700 rounded-xl shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="font-semibold text-white">引き継ぎ内容プレビュー</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              モード:{" "}
              <span
                className={`font-medium ${
                  memoryMode === "with_memory" ? "text-blue-400" : "text-orange-400"
                }`}
              >
                {memoryModeLabel(memoryMode)}
              </span>
              {parentTheme && (
                <>
                  {" "}/ 親テーマ:{" "}
                  <span className="text-gray-300">{parentTheme.title}</span>
                </>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-lg"
          >
            ×
          </button>
        </div>

        {/* 内容 */}
        <div className="px-6 py-5 space-y-5">
          {!parentTheme && (
            <div className="text-sm text-gray-400 bg-gray-800 rounded-lg px-4 py-3">
              親テーマなし — ルートテーマとして新規作成します
            </div>
          )}

          {/* 引き継ぐ内容 */}
          {memoryMode === "with_memory" && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider">
                引き継ぐ内容
              </h3>
              {inheritedConditions.length > 0 ? (
                <ul className="space-y-1.5">
                  {inheritedConditions.map((c, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-300"
                    >
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-600">引き継ぐ条件はありません</p>
              )}

              {inheritedInsights.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1.5">引き継ぐ示唆</p>
                  <ul className="space-y-1">
                    {inheritedInsights.map((ins, i) => (
                      <li
                        key={i}
                        className="text-xs text-gray-400 pl-3 border-l border-green-900 leading-relaxed"
                      >
                        {ins}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 引き継がない内容 */}
          {memoryMode === "without_memory" && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                引き継がない内容
              </h3>
              {excludedConditions.length > 0 ? (
                <ul className="space-y-1.5">
                  {excludedConditions.map((c, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-400"
                    >
                      <span className="text-red-500 mt-0.5">✕</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-600">除外する内容はありません</p>
              )}

              <div className="mt-2 text-xs text-gray-500 bg-gray-800 rounded-lg px-4 py-3 leading-relaxed">
                仮想母集団（10,000人）とシステムルールは常に共有されます
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
              memoryMode === "with_memory"
                ? "bg-blue-700 hover:bg-blue-600 text-white"
                : "bg-orange-700 hover:bg-orange-600 text-white"
            }`}
          >
            この設定でテーマを作成
          </button>
        </div>
      </div>
    </div>
  );
}
