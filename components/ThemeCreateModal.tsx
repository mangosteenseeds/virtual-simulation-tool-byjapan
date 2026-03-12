"use client";

import { useState } from "react";
import { useSimulationStore, selectCurrentTheme } from "@/store/simulationStore";
import { createTheme } from "@/lib/themeEngine";
import { MemoryModeToggle } from "@/components/MemoryModeToggle";
import { InheritancePreviewModal } from "@/components/InheritancePreviewModal";
import type { MemoryMode } from "@/types/theme";

interface Props {
  onClose: () => void;
}

export function ThemeCreateModal({ onClose }: Props) {
  const currentCondition = useSimulationStore((s) => s.currentCondition);
  const currentResult = useSimulationStore((s) => s.currentResult);
  const currentMemoryMode = useSimulationStore((s) => s.currentMemoryMode);
  const addTheme = useSimulationStore((s) => s.addTheme);
  const parentTheme = useSimulationStore(selectCurrentTheme);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [memoryMode, setMemoryMode] = useState<MemoryMode>(currentMemoryMode);
  const [showPreview, setShowPreview] = useState(false);

  function handleShowPreview(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setShowPreview(true);
  }

  function handleConfirm() {
    const theme = createTheme({
      title: title.trim(),
      description: description.trim(),
      memoryMode,
      promptText: description.trim() || title.trim(),
      objective: objective.trim() || undefined,
      parentTheme,
      currentCondition,
      latestResult: currentResult ?? undefined,
    });
    addTheme(theme);
    setShowPreview(false);
    onClose();
  }

  return (
    <>
      {/* テーマ作成フォームモーダル */}
      {!showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={onClose} />

          <div className="relative z-10 w-full max-w-lg bg-gray-900 border border-gray-700 rounded-xl shadow-2xl">
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="font-semibold text-white">新規テーマを作成</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-white transition-colors text-lg"
              >
                ×
              </button>
            </div>

            {/* フォーム */}
            <form onSubmit={handleShowPreview} className="px-6 py-5 space-y-5">
              {/* 親テーマ表示 */}
              {parentTheme && (
                <div className="text-xs text-gray-500 bg-gray-800 rounded-lg px-4 py-2.5">
                  親テーマ:{" "}
                  <span className="text-gray-300 font-medium">{parentTheme.title}</span>
                </div>
              )}

              {/* テーマ名 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400">
                  テーマ名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例：30代女性の購買行動分析"
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none text-sm text-gray-100 placeholder-gray-600 transition-colors"
                />
              </div>

              {/* 説明 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400">説明</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="このテーマで何を明らかにしたいか"
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none text-sm text-gray-100 placeholder-gray-600 resize-none transition-colors"
                />
              </div>

              {/* 目的 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400">分析目的（任意）</label>
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="例：新製品ターゲット層の特定"
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none text-sm text-gray-100 placeholder-gray-600 transition-colors"
                />
              </div>

              {/* 記憶モード */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400">記憶モード</label>
                <MemoryModeToggle value={memoryMode} onChange={setMemoryMode} />
              </div>

              {/* 現在の条件サマリー */}
              {currentResult && (
                <div className="text-xs text-gray-600 bg-gray-800/50 rounded-lg px-4 py-2.5">
                  現在の集計結果（{currentResult.totalMatched.toLocaleString()}人）を
                  {memoryMode === "with_memory" ? "引き継ぎます" : "引き継ぎません"}
                </div>
              )}

              {/* 送信 */}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="px-5 py-2 text-sm font-medium rounded-lg bg-blue-700 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                >
                  引き継ぎ内容を確認 →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 引き継ぎプレビューモーダル */}
      {showPreview && (
        <InheritancePreviewModal
          parentTheme={parentTheme}
          memoryMode={memoryMode}
          onClose={() => setShowPreview(false)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}
