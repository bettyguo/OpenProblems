import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SaturationCurve } from "./index";
import type { RatingAction } from "@/lib/schemas/rating-action";

const meta = {
  title: "viz/SaturationCurve",
  component: SaturationCurve,
  parameters: { layout: "centered" },
} satisfies Meta<typeof SaturationCurve>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseDims = (
  saturationValue: number | null,
  qualitative_band?: "low" | "medium" | "high",
): RatingAction["dimensions"] => ({
  difficulty: { grade: "A", confidence: 0.75, rationale: "x" },
  saturation:
    qualitative_band !== undefined
      ? { value: saturationValue, qualitative_band, confidence: 0.4, rationale: "x" }
      : ({
          value: saturationValue,
          confidence: 0.6,
          rationale: "x",
        } as RatingAction["dimensions"]["saturation"]),
  urgency: { stars: 5, confidence: 0.8, rationale: "x" },
  value: { stars: 5, confidence: 0.8, rationale: "x" },
  industry_call: { stars: 5, confidence: 0.75, rationale: "x" },
});

function action(slug: string, date: string, satValue: number, prior?: string): RatingAction {
  const a: RatingAction = {
    problem_slug: slug,
    date,
    methodology_version: "1.0.0",
    curator: "jikun",
    dimensions: baseDims(satValue),
    watchlist: false,
  };
  if (prior) {
    (a as RatingAction & { prior_action?: string }).prior_action = prior;
  }
  return a;
}

function qualitativeAction(
  slug: string,
  date: string,
  band: "low" | "medium" | "high",
  prior?: string,
): RatingAction {
  const a: RatingAction = {
    problem_slug: slug,
    date,
    methodology_version: "1.1.0",
    curator: "jikun",
    dimensions: baseDims(null, band),
    watchlist: false,
  };
  if (prior) {
    (a as RatingAction & { prior_action?: string }).prior_action = prior;
  }
  return a;
}

// hallucination-reduction-ish three-point history.
const HALL_RED: RatingAction[] = [
  action("hallucination-reduction", "2026-05-14", 35),
  action("hallucination-reduction", "2026-09-01", 32, "hallucination-reduction/2026-05-14-initial"),
  action(
    "hallucination-reduction",
    "2026-12-15",
    32,
    "hallucination-reduction/2026-09-01-q3-revision",
  ),
];

// compute-optimal-test-time-reasoning-ish — saturation drops on ceiling-reframing.
const COTR: RatingAction[] = [
  action("compute-optimal-test-time-reasoning", "2026-05-14", 35),
  action(
    "compute-optimal-test-time-reasoning",
    "2026-09-01",
    30,
    "compute-optimal-test-time-reasoning/2026-05-14-initial",
  ),
  action(
    "compute-optimal-test-time-reasoning",
    "2026-12-15",
    30,
    "compute-optimal-test-time-reasoning/2026-09-01-q3-revision",
  ),
];

const SINGLE_INITIAL: RatingAction[] = [action("benchmark-integrity", "2026-05-14", 45)];

// A hypothetical v1.1+ problem with no ceiling defensible.
const NA_QUALITATIVE: RatingAction[] = [
  qualitativeAction("unknown-ceiling-problem", "2026-05-14", "low"),
  qualitativeAction(
    "unknown-ceiling-problem",
    "2026-09-01",
    "medium",
    "unknown-ceiling-problem/2026-05-14-initial",
  ),
  qualitativeAction(
    "unknown-ceiling-problem",
    "2026-12-15",
    "medium",
    "unknown-ceiling-problem/2026-09-01-q3-revision",
  ),
];

// Mixed: starts numeric, hits N/A in the middle, resumes numeric. Demonstrates
// segmentation — the line breaks around the qualitative point.
const MIXED: RatingAction[] = [
  action("mixed-problem", "2026-05-14", 25),
  qualitativeAction("mixed-problem", "2026-09-01", "medium", "mixed-problem/2026-05-14-initial"),
  action("mixed-problem", "2026-12-15", 40, "mixed-problem/2026-09-01-q3-revision"),
];

export const HallucinationReduction3Actions: Story = {
  args: { actions: HALL_RED, problemTitle: "Hallucination Reduction" },
};

export const ComputeOptimal3Actions: Story = {
  args: { actions: COTR, problemTitle: "Compute-Optimal Test-Time Reasoning" },
};

export const SingleInitialOnly: Story = {
  args: { actions: SINGLE_INITIAL, problemTitle: "Benchmark Integrity (single action)" },
};

export const Empty: Story = {
  args: { actions: [], problemTitle: "Empty" },
};

export const QualitativeOnly: Story = {
  args: { actions: NA_QUALITATIVE, problemTitle: "Hypothetical no-ceiling problem" },
};

export const MixedNumericAndQualitative: Story = {
  args: { actions: MIXED, problemTitle: "Mixed numeric + N/A" },
};
