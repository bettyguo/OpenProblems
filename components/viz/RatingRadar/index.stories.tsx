import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RatingRadar } from "./index";
import type { RatingAction } from "@/lib/schemas/rating-action";

const meta = {
  title: "viz/RatingRadar",
  component: RatingRadar,
  parameters: { layout: "centered" },
} satisfies Meta<typeof RatingRadar>;

export default meta;
type Story = StoryObj<typeof meta>;

const highConfidence: RatingAction["dimensions"] = {
  difficulty: { grade: "A", confidence: 0.8, rationale: "Multi-decade open problem." },
  saturation: { value: 35, confidence: 0.7, rationale: "SOTA well below ceiling." },
  urgency: { stars: 5, confidence: 0.85, rationale: "Top-of-roadmap for every frontier lab." },
  value: { stars: 5, confidence: 0.8, rationale: "Cross-domain spillover is large." },
  industry_call: { stars: 5, confidence: 0.75, rationale: "Job postings and VC funding both up." },
};

const lowConfidence: RatingAction["dimensions"] = {
  difficulty: { grade: "B", confidence: 0.3, rationale: "Early signal; ceiling unclear." },
  saturation: { value: 60, confidence: 0.25, rationale: "No agreed human ceiling." },
  urgency: { stars: 3, confidence: 0.35, rationale: "Niche so far." },
  value: { stars: 3, confidence: 0.4, rationale: "Spillover not yet observed." },
  industry_call: { stars: 2, confidence: 0.3, rationale: "Few job postings cite this." },
};

const allZeros: RatingAction["dimensions"] = {
  difficulty: { grade: "E", confidence: 1, rationale: "Effectively solved." },
  saturation: { value: 100, confidence: 1, rationale: "Saturated; benchmark deprecated." },
  urgency: { stars: 0, confidence: 1, rationale: "No urgency remaining." },
  value: { stars: 0, confidence: 1, rationale: "No incremental value." },
  industry_call: { stars: 0, confidence: 1, rationale: "Industry has moved on." },
};

export const HighConfidence: Story = {
  args: { dimensions: highConfidence, ariaLabel: "High-confidence rating" },
};

export const LowConfidenceWatch: Story = {
  args: { dimensions: lowConfidence, ariaLabel: "Low-confidence rating (WATCH)" },
};

export const AllZeros: Story = {
  args: { dimensions: allZeros, ariaLabel: "All-zeros (solved) rating" },
};

export const Small: Story = {
  args: { dimensions: highConfidence, size: 120, staticRender: true },
};
