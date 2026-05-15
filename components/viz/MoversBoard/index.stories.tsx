import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MoversBoard, type MoverRow } from "./index";

const meta = {
  title: "viz/MoversBoard",
  component: MoversBoard,
  parameters: { layout: "padded" },
} satisfies Meta<typeof MoversBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

const hallucinationSpark = [
  { date: "2026-05-14", value: 35 },
  { date: "2026-09-01", value: 32 },
  { date: "2026-12-15", value: 32 },
];

const computeOptimalSpark = [
  { date: "2026-05-14", value: 35 },
  { date: "2026-09-01", value: 30 },
  { date: "2026-12-15", value: 30 },
];

const scalableOversightSpark = [
  { date: "2026-05-14", value: 18 },
  { date: "2026-09-01", value: 18 },
  { date: "2026-12-15", value: 22 },
];

const mechInterpSpark = [
  { date: "2026-05-14", value: 25 },
  { date: "2026-09-01", value: 28 },
  { date: "2026-12-15", value: 28 },
];

const longHorizonSpark = [
  { date: "2026-05-14", value: 30 },
  { date: "2026-09-01", value: 30 },
  { date: "2026-12-15", value: 30 },
];

const q4Rows: MoverRow[] = [
  {
    actionId: "hallucination-reduction/2026-12-15-q4-revision",
    problemSlug: "hallucination-reduction",
    problemTitle: "Faithful & Calibrated Hallucination Reduction in LLMs",
    date: "2026-12-15",
    curator: "jikun",
    primaryDeltaSummary: "difficulty confidence 0.75 → 0.80",
    sparkline: hallucinationSpark,
  },
  {
    actionId: "long-horizon-agent-reliability/2026-12-15-q4-revision",
    problemSlug: "long-horizon-agent-reliability",
    problemTitle: "Reliable Long-Horizon Agent Execution",
    date: "2026-12-15",
    curator: "jikun",
    primaryDeltaSummary: "urgency confidence 0.70 → 0.80",
    sparkline: longHorizonSpark,
  },
  {
    actionId: "scalable-oversight/2026-12-15-q4-revision",
    problemSlug: "scalable-oversight",
    problemTitle: "Scalable Oversight",
    date: "2026-12-15",
    curator: "jikun",
    primaryDeltaSummary: "saturation 18 → 22",
    sparkline: scalableOversightSpark,
  },
  {
    actionId: "compute-optimal-test-time-reasoning/2026-12-15-q4-revision",
    problemSlug: "compute-optimal-test-time-reasoning",
    problemTitle: "Compute-Optimal Test-Time Reasoning Allocation",
    date: "2026-12-15",
    curator: "jikun",
    primaryDeltaSummary: "industry_call confidence 0.70 → 0.80",
    sparkline: computeOptimalSpark,
  },
  {
    actionId: "mechanistic-interpretability/2026-12-15-q4-revision",
    problemSlug: "mechanistic-interpretability",
    problemTitle: "Mechanistic Interpretability at Frontier Scale",
    date: "2026-12-15",
    curator: "jikun",
    primaryDeltaSummary: "industry_call confidence 0.60 → 0.55",
    watchlistTransition: { from: false, to: true },
    sparkline: mechInterpSpark,
  },
];

export const Q4Cohort: Story = {
  args: { rows: q4Rows, windowDays: 90 },
};

export const SingleWatchlistFlip: Story = {
  args: {
    rows: [q4Rows[4]!], // mech-interp watchlist flip
    windowDays: 30,
  },
};

export const Empty: Story = {
  args: { rows: [], windowDays: 30 },
};
