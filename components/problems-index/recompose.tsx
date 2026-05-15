"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_COMPOSITE_WEIGHTS,
  isValidCompositeWeights,
  type CompositeWeights,
} from "@/lib/ratings/normalize";

/**
 * Recompose — Phase 3 §13 deliverable / Unit 3.10.
 *
 * Client-side composite-weight UI per Unit 3.0 D-6:
 *   - URL search params (`?wd=...&wv=...&wu=...&wi=...&ws=...`) carry weights
 *     for shareability.
 *   - On invalid params (sum ≠ 1 ±0.01 or any < 0) the UI silently falls back
 *     to the §8.3 defaults.
 *   - No localStorage persistence (Q35 lean — Phase-4 enhancement).
 *
 * Renders 5 number inputs plus a "Reset to §8.3" button. The parent
 * (ProblemsIndex) holds the weights state and reads the recomputed composite
 * via `composite(points, weights)`.
 */

const URL_PARAM_NAMES = {
  difficulty: "wd",
  value: "wv",
  urgency: "wu",
  industry_call: "wi",
  saturation: "ws",
} as const;

export interface RecomposeProps {
  weights: CompositeWeights;
  onChange: (w: CompositeWeights) => void;
}

export function Recompose({ weights, onChange }: RecomposeProps) {
  const sum =
    weights.difficulty +
    weights.value +
    weights.urgency +
    weights.industry_call +
    weights.saturation;
  const isCustom =
    weights.difficulty !== DEFAULT_COMPOSITE_WEIGHTS.difficulty ||
    weights.value !== DEFAULT_COMPOSITE_WEIGHTS.value ||
    weights.urgency !== DEFAULT_COMPOSITE_WEIGHTS.urgency ||
    weights.industry_call !== DEFAULT_COMPOSITE_WEIGHTS.industry_call ||
    weights.saturation !== DEFAULT_COMPOSITE_WEIGHTS.saturation;
  const valid = isValidCompositeWeights(weights);

  const setOne = (key: keyof CompositeWeights) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = { ...weights, [key]: Number(e.target.value) };
    onChange(next);
  };

  return (
    <details className="border-border mt-4 rounded border p-3">
      <summary className="cursor-pointer text-sm font-medium select-none">
        Recompose weights{" "}
        <span className="text-muted-foreground ml-2 text-xs font-normal">
          {isCustom ? "(custom)" : "(§8.3 defaults)"}
        </span>
      </summary>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <WeightInput
          label="Difficulty"
          value={weights.difficulty}
          onChange={setOne("difficulty")}
          chartIndex={1}
        />
        <WeightInput
          label="Saturation"
          value={weights.saturation}
          onChange={setOne("saturation")}
          chartIndex={2}
        />
        <WeightInput
          label="Urgency"
          value={weights.urgency}
          onChange={setOne("urgency")}
          chartIndex={3}
        />
        <WeightInput
          label="Value"
          value={weights.value}
          onChange={setOne("value")}
          chartIndex={4}
        />
        <WeightInput
          label="Industry"
          value={weights.industry_call}
          onChange={setOne("industry_call")}
          chartIndex={5}
        />
      </div>
      <div className="text-muted-foreground mt-3 flex items-center justify-between text-xs">
        <span>
          Sum:{" "}
          <span
            className={
              valid ? "text-foreground font-mono" : "font-mono text-[var(--color-chart-3)]"
            }
          >
            {sum.toFixed(2)}
          </span>
          {!valid ? (
            <span className="ml-2 italic">
              must be 1.00 (±0.01) and non-negative; falling back to defaults until valid
            </span>
          ) : null}
        </span>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_COMPOSITE_WEIGHTS)}
          className="border-border hover:border-accent text-muted-foreground hover:text-foreground rounded border px-2 py-1 text-xs"
          aria-label="Reset weights to §8.3 defaults"
          disabled={!isCustom}
        >
          Reset to §8.3
        </button>
      </div>
    </details>
  );
}

function WeightInput({
  label,
  value,
  onChange,
  chartIndex,
}: {
  label: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  chartIndex: 1 | 2 | 3 | 4 | 5;
}) {
  return (
    <label className="block text-xs">
      <span
        className="text-muted-foreground mb-1 block font-mono tracking-wide uppercase"
        style={{ color: `var(--color-chart-${chartIndex})` }}
      >
        {label}
      </span>
      <input
        type="number"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={onChange}
        className="border-border bg-background text-foreground focus-visible:ring-ring w-full rounded border px-2 py-1.5 font-mono text-sm focus-visible:ring-2 focus-visible:outline-none"
      />
    </label>
  );
}

/**
 * Read weights from `window.location.search` on the client. Falls back to
 * §8.3 defaults when params are missing OR invalid. Returns the resolved
 * weights and whether the URL contained any custom values.
 */
export function readWeightsFromUrl(): CompositeWeights {
  if (typeof window === "undefined") return DEFAULT_COMPOSITE_WEIGHTS;
  const params = new URLSearchParams(window.location.search);
  const parsed: CompositeWeights = {
    difficulty: parseUrlNum(
      params.get(URL_PARAM_NAMES.difficulty),
      DEFAULT_COMPOSITE_WEIGHTS.difficulty,
    ),
    value: parseUrlNum(params.get(URL_PARAM_NAMES.value), DEFAULT_COMPOSITE_WEIGHTS.value),
    urgency: parseUrlNum(params.get(URL_PARAM_NAMES.urgency), DEFAULT_COMPOSITE_WEIGHTS.urgency),
    industry_call: parseUrlNum(
      params.get(URL_PARAM_NAMES.industry_call),
      DEFAULT_COMPOSITE_WEIGHTS.industry_call,
    ),
    saturation: parseUrlNum(
      params.get(URL_PARAM_NAMES.saturation),
      DEFAULT_COMPOSITE_WEIGHTS.saturation,
    ),
  };
  return isValidCompositeWeights(parsed) ? parsed : DEFAULT_COMPOSITE_WEIGHTS;
}

function parseUrlNum(raw: string | null, fallback: number): number {
  if (raw === null) return fallback;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Sync weights to `window.location.search` via `history.replaceState`. Avoids
 * Next.js router invocation so per-keystroke updates don't trigger re-renders
 * of the whole route tree.
 */
export function writeWeightsToUrl(w: CompositeWeights): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const isDefault =
    w.difficulty === DEFAULT_COMPOSITE_WEIGHTS.difficulty &&
    w.value === DEFAULT_COMPOSITE_WEIGHTS.value &&
    w.urgency === DEFAULT_COMPOSITE_WEIGHTS.urgency &&
    w.industry_call === DEFAULT_COMPOSITE_WEIGHTS.industry_call &&
    w.saturation === DEFAULT_COMPOSITE_WEIGHTS.saturation;
  if (isDefault) {
    // Strip the weight params from the URL when reset to defaults — keeps the
    // shareable URL clean.
    for (const p of Object.values(URL_PARAM_NAMES)) params.delete(p);
  } else {
    params.set(URL_PARAM_NAMES.difficulty, w.difficulty.toString());
    params.set(URL_PARAM_NAMES.value, w.value.toString());
    params.set(URL_PARAM_NAMES.urgency, w.urgency.toString());
    params.set(URL_PARAM_NAMES.industry_call, w.industry_call.toString());
    params.set(URL_PARAM_NAMES.saturation, w.saturation.toString());
  }
  const q = params.toString();
  const next = q ? `${window.location.pathname}?${q}` : window.location.pathname;
  window.history.replaceState({}, "", next);
}

/** Combined hook for the parent component. */
export function useUrlWeights(): [CompositeWeights, (w: CompositeWeights) => void] {
  const [weights, setWeightsState] = useState<CompositeWeights>(DEFAULT_COMPOSITE_WEIGHTS);
  useEffect(() => {
    setWeightsState(readWeightsFromUrl());
  }, []);
  const setWeights = (w: CompositeWeights) => {
    setWeightsState(w);
    writeWeightsToUrl(w);
  };
  return [weights, setWeights];
}
