"use client";

import { useSimulationStore } from "@/store/simulationStore";
import { parseNaturalText } from "@/lib/parserRules";
import type { SimulationCondition } from "@/types/simulation";

const GENDER_LABEL: Record<string, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
};

interface ConditionChip {
  label: string;
  removeText: string; // 自然文で削除する際に使う表現
}

function buildChips(condition: SimulationCondition): ConditionChip[] {
  const chips: ConditionChip[] = [];

  if (condition.ageRange) {
    chips.push({
      label: `${condition.ageRange.min}〜${condition.ageRange.max}歳`,
      removeText: `${condition.ageRange.min}〜${condition.ageRange.max}歳の条件を外して`,
    });
  }

  condition.genders?.forEach((g) =>
    chips.push({
      label: GENDER_LABEL[g] ?? g,
      removeText: `${GENDER_LABEL[g] ?? g}条件を外して`,
    })
  );

  condition.areas?.forEach((a) =>
    chips.push({ label: a, removeText: `${a}条件を外して` })
  );

  condition.households?.forEach((h) =>
    chips.push({ label: h, removeText: `${h}条件を外して` })
  );

  condition.occupations?.forEach((o) =>
    chips.push({ label: o, removeText: `${o}条件を外して` })
  );

  condition.incomeBands?.forEach((i) =>
    chips.push({ label: `年収:${i}`, removeText: `年収${i}条件を外して` })
  );

  condition.educationBands?.forEach((e) =>
    chips.push({ label: e, removeText: `${e}条件を外して` })
  );

  condition.lifeStages?.forEach((l) =>
    chips.push({ label: l, removeText: `${l}条件を外して` })
  );

  condition.interests?.forEach((i) =>
    chips.push({ label: `関心:${i}`, removeText: `${i}への関心条件を外して` })
  );

  condition.channels?.forEach((c) =>
    chips.push({ label: c, removeText: `${c}条件を外して` })
  );

  condition.brandPreference?.forEach((b) =>
    chips.push({ label: b, removeText: `${b}条件を外して` })
  );

  condition.priceSensitivity?.forEach((p) =>
    chips.push({ label: `価格感度:${p.slice(0, 8)}…`, removeText: `${p}条件を外して` })
  );

  condition.purchaseStyles?.forEach((s) =>
    chips.push({ label: s, removeText: `${s}条件を外して` })
  );

  condition.decisionTypes?.forEach((d) =>
    chips.push({ label: d, removeText: `${d}条件を外して` })
  );

  condition.purchaseFrequency?.forEach((f) =>
    chips.push({ label: f, removeText: `${f}条件を外して` })
  );

  condition.categoryIntent?.forEach((c) =>
    chips.push({ label: `意向:${c}`, removeText: `${c}購買意向条件を外して` })
  );

  return chips;
}

export function ConditionSummary() {
  const currentCondition = useSimulationStore((s) => s.currentCondition);
  const applyParsedCondition = useSimulationStore((s) => s.applyParsedCondition);
  const resetAll = useSimulationStore((s) => s.resetAll);

  const chips = buildChips(currentCondition);

  if (chips.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        現在の条件: <span className="text-gray-400">全体（条件なし）</span>
      </div>
    );
  }

  function handleRemoveChip(removeText: string) {
    const parsed = parseNaturalText(removeText);
    applyParsedCondition(parsed, removeText);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium">現在の条件</span>
        <button
          onClick={resetAll}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          全条件クリア
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs"
          >
            {chip.label}
            <button
              onClick={() => handleRemoveChip(chip.removeText)}
              className="ml-0.5 text-blue-400 hover:text-white transition-colors leading-none"
              title="この条件を削除"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
