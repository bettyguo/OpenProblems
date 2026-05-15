import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RatingHistoryStream } from "./index";
import type { RatingAction } from "@/lib/schemas/rating-action";

const meta = {
  title: "viz/RatingHistoryStream",
  component: RatingHistoryStream,
  parameters: { layout: "padded" },
} satisfies Meta<typeof RatingHistoryStream>;

export default meta;
type Story = StoryObj<typeof meta>;

function dims(
  diffGrade: "S" | "A" | "B" | "C" | "D" | "E",
  satValue: number,
  urg: number,
  val: number,
  ind: number,
): RatingAction["dimensions"] {
  return {
    difficulty: { grade: diffGrade, confidence: 0.7, rationale: "x" },
    saturation: { value: satValue, confidence: 0.6, rationale: "x" },
    urgency: { stars: urg, confidence: 0.7, rationale: "x" },
    value: { stars: val, confidence: 0.7, rationale: "x" },
    industry_call: { stars: ind, confidence: 0.7, rationale: "x" },
  };
}

function action(date: string, d: RatingAction["dimensions"]): RatingAction {
  return {
    problem_slug: "demo",
    date,
    methodology_version: "1.0.0",
    curator: "jikun",
    dimensions: d,
    watchlist: false,
  };
}

// Hallucination-reduction-like: high urgency / value / industry-call held flat,
// saturation drops modestly across the three actions, difficulty unchanged.
const HALL_RED: RatingAction[] = [
  action("2026-05-14", dims("A", 35, 5, 5, 5)),
  action("2026-09-01", dims("A", 32, 5, 5, 5)),
  action("2026-12-15", dims("A", 32, 5, 5, 5)),
];

// Scalable-oversight-like: difficulty S throughout, saturation slowly climbs.
const SCALABLE: RatingAction[] = [
  action("2026-05-14", dims("S", 18, 5, 5, 4)),
  action("2026-09-01", dims("S", 18, 5, 5, 4)),
  action("2026-12-15", dims("S", 22, 5, 5, 4)),
];

// Showcase: each dimension moves over time to demonstrate streamgraph dynamics.
const ALL_DIMENSIONS_MOVE: RatingAction[] = [
  action("2026-05-14", dims("B", 60, 3, 3, 2)),
  action("2026-09-01", dims("A", 50, 4, 4, 3)),
  action("2026-12-15", dims("A", 40, 5, 4, 4)),
  action("2027-03-15", dims("S", 30, 5, 5, 5)),
];

const SINGLE: RatingAction[] = [action("2026-05-14", dims("A", 35, 5, 5, 5))];

export const HallucinationReduction3Actions: Story = {
  args: { actions: HALL_RED, problemTitle: "Hallucination Reduction" },
};

export const ScalableOversight3Actions: Story = {
  args: { actions: SCALABLE, problemTitle: "Scalable Oversight" },
};

export const AllDimensionsMove4Actions: Story = {
  args: {
    actions: ALL_DIMENSIONS_MOVE,
    problemTitle: "Showcase — every dimension moves",
  },
};

export const SingleInitialOnly: Story = {
  args: { actions: SINGLE, problemTitle: "Single initial action" },
};

export const Empty: Story = {
  args: { actions: [], problemTitle: "Empty" },
};
