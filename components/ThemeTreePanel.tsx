"use client";

import { useState } from "react";
import { useSimulationStore } from "@/store/simulationStore";
import { buildThemeTree, memoryModeLabel } from "@/lib/themeEngine";
import { ThemeCreateModal } from "@/components/ThemeCreateModal";
import type { ThemeNode } from "@/lib/themeEngine";

function ThemeNodeItem({
  node,
  currentThemeId,
  onSelect,
  onDelete,
}: {
  node: ThemeNode;
  currentThemeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { theme, depth, children } = node;
  const isCurrent = theme.id === currentThemeId;
  const hasResult = !!theme.latestResult;

  return (
    <div>
      <div
        className={`group relative rounded-lg border px-3 py-2.5 mb-1.5 cursor-pointer transition-colors ${
          isCurrent
            ? "border-blue-600 bg-blue-900/30"
            : "border-gray-800 bg-gray-900/50 hover:border-gray-700"
        }`}
        style={{ marginLeft: `${depth * 14}px` }}
        onClick={() => onSelect(theme.id)}
      >
        {/* インデントライン */}
        {depth > 0 && (
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-gray-700 -translate-x-3"
          />
        )}

        {/* ヘッダー行 */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {depth > 0 && <span className="text-gray-600 text-xs">└</span>}
            <span
              className={`text-xs font-medium truncate ${
                isCurrent ? "text-blue-300" : "text-gray-300"
              }`}
            >
              {theme.title}
            </span>
          </div>

          {/* 削除ボタン（ホバー時表示） */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(theme.id);
            }}
            className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all text-xs flex-shrink-0"
            title="テーマを削除"
          >
            ×
          </button>
        </div>

        {/* バッジ群 */}
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span
            className={`text-xs px-1.5 py-0.5 rounded border ${
              theme.memoryMode === "with_memory"
                ? "text-blue-400 border-blue-800 bg-blue-900/20"
                : "text-orange-400 border-orange-800 bg-orange-900/20"
            }`}
          >
            {memoryModeLabel(theme.memoryMode)}
          </span>
          {hasResult && (
            <span className="text-xs text-gray-500">
              {theme.latestResult!.totalMatched.toLocaleString()}人
            </span>
          )}
          {isCurrent && (
            <span className="text-xs text-blue-400 font-medium">選択中</span>
          )}
        </div>

        {/* 目的 */}
        {theme.objective && (
          <p className="text-xs text-gray-600 mt-1 line-clamp-1">{theme.objective}</p>
        )}
      </div>

      {/* 子テーマを再帰的に描画 */}
      {children.map((child) => (
        <ThemeNodeItem
          key={child.theme.id}
          node={child}
          currentThemeId={currentThemeId}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export function ThemeTreePanel() {
  const themes = useSimulationStore((s) => s.themes);
  const currentThemeId = useSimulationStore((s) => s.currentThemeId);
  const setCurrentTheme = useSimulationStore((s) => s.setCurrentTheme);
  const deleteTheme = useSimulationStore((s) => s.deleteTheme);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const tree = buildThemeTree(themes);

  return (
    <div className="p-4 space-y-2">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          テーマ管理
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="text-xs px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-600 text-white transition-colors"
        >
          + 新規テーマ
        </button>
      </div>

      {/* テーマがない場合 */}
      {themes.length === 0 && (
        <div className="text-xs text-gray-600 px-1 space-y-1.5">
          <p>テーマはまだありません</p>
          <p className="leading-relaxed">
            「+ 新規テーマ」で分析テーマを作成すると、親子構造で管理できます
          </p>
        </div>
      )}

      {/* ツリー */}
      {tree.map((node) => (
        <ThemeNodeItem
          key={node.theme.id}
          node={node}
          currentThemeId={currentThemeId}
          onSelect={setCurrentTheme}
          onDelete={deleteTheme}
        />
      ))}

      {/* テーマ選択中なら「テーマから外れる」ボタン */}
      {currentThemeId && (
        <button
          onClick={() => setCurrentTheme(null)}
          className="w-full mt-2 text-xs text-gray-600 hover:text-gray-400 transition-colors py-1 border border-dashed border-gray-800 rounded-lg"
        >
          テーマから外れる（フリー分析に戻る）
        </button>
      )}

      {/* テーマ作成モーダル */}
      {showCreateModal && (
        <ThemeCreateModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
