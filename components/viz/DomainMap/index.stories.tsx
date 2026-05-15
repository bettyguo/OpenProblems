import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DomainMap } from "./index";
import type { DomainMapNode, DomainMapLink } from "./types";

const meta = {
  title: "viz/DomainMap",
  component: DomainMap,
  parameters: { layout: "centered" },
} satisfies Meta<typeof DomainMap>;

export default meta;
type Story = StoryObj<typeof meta>;

// Realistic 5-domain × 10-problem fixture mirroring Phase-3-close state.
const FULL_NODES: DomainMapNode[] = [
  // Domains
  { id: "domain:deep-learning", kind: "domain", label: "Deep Learning", composite: 3.8, hue: 1 },
  { id: "domain:alignment", kind: "domain", label: "Alignment", composite: 4.1, hue: 2 },
  { id: "domain:reasoning", kind: "domain", label: "Reasoning", composite: 3.7, hue: 3 },
  { id: "domain:applications", kind: "domain", label: "Applications", composite: 3.4, hue: 4 },
  {
    id: "domain:interpretability",
    kind: "domain",
    label: "Interpretability",
    composite: 3.5,
    hue: 5,
  },

  // Subdomains
  {
    id: "subdomain:dl/scaling",
    kind: "subdomain",
    label: "Scaling",
    composite: 3.9,
    hue: 1,
    parent: "domain:deep-learning",
  },
  {
    id: "subdomain:dl/foundation",
    kind: "subdomain",
    label: "Foundation Models",
    composite: 3.7,
    hue: 1,
    parent: "domain:deep-learning",
  },
  {
    id: "subdomain:align/oversight",
    kind: "subdomain",
    label: "Scalable Oversight",
    composite: 4.0,
    hue: 2,
    parent: "domain:alignment",
  },
  {
    id: "subdomain:reasoning/agents",
    kind: "subdomain",
    label: "Agents",
    composite: 3.8,
    hue: 3,
    parent: "domain:reasoning",
  },

  // Problems
  {
    id: "problem:hallucination-reduction",
    kind: "problem",
    label: "Hallucination Reduction",
    composite: 3.9,
    hue: 1,
    href: "/problems/hallucination-reduction",
    parent: "subdomain:dl/foundation",
  },
  {
    id: "problem:scalable-oversight",
    kind: "problem",
    label: "Scalable Oversight",
    composite: 4.2,
    hue: 2,
    href: "/problems/scalable-oversight",
    parent: "subdomain:align/oversight",
  },
  {
    id: "problem:long-horizon-agent-reliability",
    kind: "problem",
    label: "Long-Horizon Agent Reliability",
    composite: 4.0,
    hue: 3,
    href: "/problems/long-horizon-agent-reliability",
    parent: "subdomain:reasoning/agents",
  },
  {
    id: "problem:compute-optimal-test-time-reasoning",
    kind: "problem",
    label: "Compute-Optimal Test-Time Reasoning",
    composite: 3.6,
    hue: 3,
    href: "/problems/compute-optimal-test-time-reasoning",
    parent: "subdomain:reasoning/agents",
  },
  {
    id: "problem:mechanistic-interpretability",
    kind: "problem",
    label: "Mechanistic Interpretability",
    composite: 3.5,
    hue: 5,
    href: "/problems/mechanistic-interpretability",
    parent: "domain:interpretability",
  },
  {
    id: "problem:benchmark-integrity",
    kind: "problem",
    label: "Benchmark Integrity",
    composite: 3.3,
    hue: 2,
    href: "/problems/benchmark-integrity",
    parent: "domain:alignment",
  },
  {
    id: "problem:genome-foundation-models",
    kind: "problem",
    label: "Genome Foundation Models",
    composite: 3.4,
    hue: 4,
    href: "/problems/genome-foundation-models",
    parent: "domain:applications",
  },
  {
    id: "problem:weather-foundation-models",
    kind: "problem",
    label: "Weather Foundation Models",
    composite: 3.2,
    hue: 4,
    href: "/problems/weather-foundation-models",
    parent: "domain:applications",
  },
  {
    id: "problem:partial-differential-equations",
    kind: "problem",
    label: "PDEs",
    composite: 3.0,
    hue: 4,
    href: "/problems/partial-differential-equations",
    parent: "domain:applications",
  },
  {
    id: "problem:long-context-recall",
    kind: "problem",
    label: "Long-Context Recall",
    composite: 3.6,
    hue: 1,
    href: "/problems/long-context-recall",
    parent: "subdomain:dl/scaling",
  },
];

const FULL_LINKS: DomainMapLink[] = [
  // Subdomain → domain
  { source: "subdomain:dl/scaling", target: "domain:deep-learning" },
  { source: "subdomain:dl/foundation", target: "domain:deep-learning" },
  { source: "subdomain:align/oversight", target: "domain:alignment" },
  { source: "subdomain:reasoning/agents", target: "domain:reasoning" },
  // Problem → parent
  { source: "problem:hallucination-reduction", target: "subdomain:dl/foundation" },
  { source: "problem:scalable-oversight", target: "subdomain:align/oversight" },
  { source: "problem:long-horizon-agent-reliability", target: "subdomain:reasoning/agents" },
  { source: "problem:compute-optimal-test-time-reasoning", target: "subdomain:reasoning/agents" },
  { source: "problem:mechanistic-interpretability", target: "domain:interpretability" },
  { source: "problem:benchmark-integrity", target: "domain:alignment" },
  { source: "problem:genome-foundation-models", target: "domain:applications" },
  { source: "problem:weather-foundation-models", target: "domain:applications" },
  { source: "problem:partial-differential-equations", target: "domain:applications" },
  { source: "problem:long-context-recall", target: "subdomain:dl/scaling" },
];

const SINGLE_DOMAIN_NODES: DomainMapNode[] = [
  { id: "domain:alignment", kind: "domain", label: "Alignment", composite: 4.1, hue: 2 },
  {
    id: "subdomain:align/oversight",
    kind: "subdomain",
    label: "Scalable Oversight",
    composite: 4.0,
    hue: 2,
    parent: "domain:alignment",
  },
  {
    id: "subdomain:align/interp",
    kind: "subdomain",
    label: "Interpretability",
    composite: 3.5,
    hue: 2,
    parent: "domain:alignment",
  },
  {
    id: "problem:scalable-oversight",
    kind: "problem",
    label: "Scalable Oversight",
    composite: 4.2,
    hue: 2,
    href: "/problems/scalable-oversight",
    parent: "subdomain:align/oversight",
  },
  {
    id: "problem:benchmark-integrity",
    kind: "problem",
    label: "Benchmark Integrity",
    composite: 3.3,
    hue: 2,
    href: "/problems/benchmark-integrity",
    parent: "domain:alignment",
  },
  {
    id: "problem:mechanistic-interpretability",
    kind: "problem",
    label: "Mechanistic Interpretability",
    composite: 3.5,
    hue: 2,
    href: "/problems/mechanistic-interpretability",
    parent: "subdomain:align/interp",
  },
];
const SINGLE_DOMAIN_LINKS: DomainMapLink[] = [
  { source: "subdomain:align/oversight", target: "domain:alignment" },
  { source: "subdomain:align/interp", target: "domain:alignment" },
  { source: "problem:scalable-oversight", target: "subdomain:align/oversight" },
  { source: "problem:mechanistic-interpretability", target: "subdomain:align/interp" },
  { source: "problem:benchmark-integrity", target: "domain:alignment" },
];

const TWO_DOMAINS_OVERLAP_NODES: DomainMapNode[] = [
  { id: "domain:alignment", kind: "domain", label: "Alignment", composite: 4.1, hue: 2 },
  {
    id: "domain:interpretability",
    kind: "domain",
    label: "Interpretability",
    composite: 3.5,
    hue: 5,
  },
  {
    id: "subdomain:align/interp",
    kind: "subdomain",
    label: "Interpretability",
    composite: 3.6,
    hue: 2,
    parent: "domain:alignment",
  },
  {
    id: "subdomain:interp/circuits",
    kind: "subdomain",
    label: "Interpretability",
    composite: 3.7,
    hue: 5,
    parent: "domain:interpretability",
  },
  {
    id: "problem:saes",
    kind: "problem",
    label: "Sparse Autoencoders",
    composite: 3.6,
    hue: 2,
    parent: "subdomain:align/interp",
  },
  {
    id: "problem:circuits",
    kind: "problem",
    label: "Circuit Extraction",
    composite: 3.7,
    hue: 5,
    parent: "subdomain:interp/circuits",
  },
];
const TWO_DOMAINS_OVERLAP_LINKS: DomainMapLink[] = [
  { source: "subdomain:align/interp", target: "domain:alignment" },
  { source: "subdomain:interp/circuits", target: "domain:interpretability" },
  { source: "problem:saes", target: "subdomain:align/interp" },
  { source: "problem:circuits", target: "subdomain:interp/circuits" },
];

export const FullGraph: Story = {
  args: { nodes: FULL_NODES, links: FULL_LINKS },
};

export const SingleDomain: Story = {
  args: { nodes: SINGLE_DOMAIN_NODES, links: SINGLE_DOMAIN_LINKS },
};

export const TwoDomainsOverlap: Story = {
  args: { nodes: TWO_DOMAINS_OVERLAP_NODES, links: TWO_DOMAINS_OVERLAP_LINKS },
};

export const Empty: Story = {
  args: { nodes: [], links: [] },
};

export const DimmedSubset: Story = {
  args: {
    nodes: FULL_NODES,
    links: FULL_LINKS,
    dimmedIds: new Set([
      "domain:applications",
      "problem:genome-foundation-models",
      "problem:weather-foundation-models",
      "problem:partial-differential-equations",
    ]),
  },
};
