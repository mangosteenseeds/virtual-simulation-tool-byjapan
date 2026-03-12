export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-white">
          仮想人口シミュレーター
        </h1>
        <p className="text-gray-400 text-sm">
          Phase 1 基盤構築完了 — Phase 2 で条件入力UIを実装予定
        </p>
        <a
          href="/simulation"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors"
        >
          シミュレーション開始
        </a>
      </div>
    </main>
  );
}
