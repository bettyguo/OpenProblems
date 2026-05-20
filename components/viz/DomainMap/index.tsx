import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import type { DomainMapNode, DomainMapLink } from "./types";

/**
 * DomainMap — Phase 4 catalog item 4 (§11).
 *
 * D3 force-directed graph of (domain → subdomain → problem) nodes,
 * sized by composite rating. SSR-only — d3-force runs at module render
 * time with deterministic initial positions, producing a static SVG.
 *
 * Per Unit 4.0 D-1: SVG render target (not Canvas).
 * Per Unit 4.0 D-2: tree-shaken d3-force only; no d3-selection client use.
 * Per Unit 4.0 D-3: all 3 hierarchy levels visible at once (no collapse).
 * Per Unit 4.0 D-4: radius = sqrt(composite) × k; domain k×1.4, subdomain k×1.1.
 * Per Unit 4.0 D-5: hue from `--color-chart-{1..5}` tokens.
 * Per Unit 4.0 D-6: hover via native <title>; click via <a>. Drag deferred.
 *
 * Phase-4 scope split:
 *   - Unit 4.2 (this) ships the presentational viz.
 *   - Unit 4.3 `/domains` and Unit 4.4 `/` wrap it with filter chips.
 *   - Drag is a Phase-5 / follow-on enhancement; not in 4.2.
 */

const VIEW_W = 600;
const VIEW_H = 420;
const LINK_DISTANCE = 60;
const CHARGE_STRENGTH = -180;
const CENTER_STRENGTH = 0.05;
const N_TICKS = 300;

const RADIUS_K_PROBLEM = 5;
const RADIUS_K_SUBDOMAIN = 5.5;
const RADIUS_K_DOMAIN = 7;

interface SimNode extends SimulationNodeDatum, DomainMapNode {}

interface PositionedNode extends DomainMapNode {
  x: number;
  y: number;
  radius: number;
}

interface ViewBoxRect {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export interface DomainMapProps {
  nodes: DomainMapNode[];
  links: DomainMapLink[];
  /**
   * Optional override for the rendered width. Defaults to `"100%"` so the
   * SVG fills its container; the viewBox is auto-fit to the simulated
   * layout extent so all nodes stay visible regardless of node count.
   */
  width?: number | string;
  /** Optional override for the rendered height. Defaults to `undefined` (driven by viewBox aspect). */
  height?: number | string;
  /** Optional aria-label override. Defaults to "Domain map of …N… problems across …M… domains". */
  ariaLabel?: string;
  /** Optional set of node ids to dim (for page-layer filter chips, Unit 4.3 / 4.4). */
  dimmedIds?: Set<string>;
}

/**
 * Compute the SVG viewBox rectangle that contains every positioned node
 * plus a uniform pad of `max(radius) + labelHeight` on every side. This
 * makes the viewBox auto-fit the d3-force simulation's actual extent so
 * graphs with many nodes (where the force layout spreads well beyond a
 * fixed-size viewport) don't get clipped. Combined with default
 * `preserveAspectRatio="xMidYMid meet"` and `width="100%"`, the SVG
 * scales to its container.
 */
function computeViewBoxFromLayout(positioned: PositionedNode[]): ViewBoxRect {
  if (positioned.length === 0) {
    return { minX: 0, minY: 0, width: VIEW_W, height: VIEW_H };
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let maxRadius = 0;
  for (const n of positioned) {
    if (n.x - n.radius < minX) minX = n.x - n.radius;
    if (n.x + n.radius > maxX) maxX = n.x + n.radius;
    if (n.y - n.radius < minY) minY = n.y - n.radius;
    if (n.y + n.radius > maxY) maxY = n.y + n.radius;
    if (n.radius > maxRadius) maxRadius = n.radius;
  }
  // Pad enough room for labels (rendered at `y + radius + fontSize + 1`,
  // fontSize ≤ 11 for domain nodes; allow ~24 px for label height + slack).
  const pad = maxRadius + 24;
  return {
    minX: minX - pad,
    minY: minY - pad,
    width: maxX - minX + 2 * pad,
    height: maxY - minY + 2 * pad,
  };
}

function radiusFor(node: DomainMapNode): number {
  const k =
    node.kind === "domain"
      ? RADIUS_K_DOMAIN
      : node.kind === "subdomain"
        ? RADIUS_K_SUBDOMAIN
        : RADIUS_K_PROBLEM;
  return Math.sqrt(Math.max(node.composite, 0.1)) * k;
}

function fillOpacityFor(kind: DomainMapNode["kind"]): number {
  if (kind === "domain") return 0.85;
  if (kind === "subdomain") return 0.55;
  return 0.75;
}

function computeLayout(nodes: DomainMapNode[], links: DomainMapLink[]): PositionedNode[] {
  if (nodes.length === 0) return [];

  // Deterministic initial positions on a circle around the viewport center.
  // d3-force normally seeds with Math.random(); pre-seeding makes the SSR output
  // stable across renders (no hydration mismatch surface, even though there's
  // no client hydration in Unit 4.2).
  const simNodes: SimNode[] = nodes.map((n, i) => ({
    ...n,
    x: VIEW_W / 2 + Math.cos((i / nodes.length) * Math.PI * 2) * 100,
    y: VIEW_H / 2 + Math.sin((i / nodes.length) * Math.PI * 2) * 100,
  }));

  // d3-force's forceLink mutates `source` / `target` from id strings to node
  // references. Use working copies so the caller's `links` array stays intact.
  const simLinks: SimulationLinkDatum<SimNode>[] = links.map((l) => ({
    source: l.source,
    target: l.target,
  }));

  const sim = forceSimulation<SimNode>(simNodes)
    .force(
      "link",
      forceLink<SimNode, SimulationLinkDatum<SimNode>>(simLinks)
        .id((d) => d.id)
        .distance(LINK_DISTANCE),
    )
    .force("charge", forceManyBody().strength(CHARGE_STRENGTH))
    .force("center", forceCenter(VIEW_W / 2, VIEW_H / 2).strength(CENTER_STRENGTH))
    .stop();

  for (let i = 0; i < N_TICKS; i++) sim.tick();

  return simNodes.map((n) => ({
    ...(n as DomainMapNode),
    x: n.x ?? VIEW_W / 2,
    y: n.y ?? VIEW_H / 2,
    radius: radiusFor(n),
  }));
}

function buildDescription(nodes: DomainMapNode[]): string {
  if (nodes.length === 0) return "Empty domain map.";
  const byKind: Record<DomainMapNodeKind, DomainMapNode[]> = {
    domain: [],
    subdomain: [],
    problem: [],
  };
  for (const n of nodes) byKind[n.kind].push(n);
  const counts = `${byKind.domain.length} domains, ${byKind.subdomain.length} subdomains, ${byKind.problem.length} problems`;
  const domainSummaries = byKind.domain
    .map((d) => {
      const problems = byKind.problem.filter(
        (p) => p.parent === d.id || isDescendantOf(p, d, nodes),
      );
      const problemNames = problems
        .map((p) => `${p.label} (composite ${p.composite.toFixed(1)})`)
        .join(", ");
      return `${d.label} (composite ${d.composite.toFixed(1)}, ${problems.length} problem${problems.length === 1 ? "" : "s"})${problemNames ? `: ${problemNames}` : ""}`;
    })
    .join("; ");
  return `Domain map: ${counts}. ${domainSummaries}.`;
}

type DomainMapNodeKind = DomainMapNode["kind"];

function isDescendantOf(p: DomainMapNode, d: DomainMapNode, all: DomainMapNode[]): boolean {
  let cur: DomainMapNode | undefined = p;
  const byId = new Map(all.map((n) => [n.id, n]));
  while (cur && cur.parent) {
    if (cur.parent === d.id) return true;
    cur = byId.get(cur.parent);
  }
  return false;
}

export function DomainMap({
  nodes,
  links,
  width = "100%",
  height,
  ariaLabel,
  dimmedIds,
}: DomainMapProps) {
  const counts = nodes.reduce(
    (acc, n) => {
      acc[n.kind]++;
      return acc;
    },
    { domain: 0, subdomain: 0, problem: 0 } as Record<DomainMapNodeKind, number>,
  );
  const computedAriaLabel =
    ariaLabel ?? `Domain map of ${counts.problem} problems across ${counts.domain} domains`;

  if (nodes.length === 0) {
    return (
      <figure className="text-muted-foreground text-xs italic">
        <svg
          role="img"
          aria-label="Domain map (no data)"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          width={width}
          height={height}
          className="block"
        >
          <desc>Empty domain map.</desc>
        </svg>
        <figcaption>No domains to map.</figcaption>
      </figure>
    );
  }

  const positioned = computeLayout(nodes, links);
  const byId = new Map(positioned.map((n) => [n.id, n]));
  const desc = buildDescription(nodes);
  const vb = computeViewBoxFromLayout(positioned);

  return (
    <figure>
      <svg
        role="img"
        aria-label={computedAriaLabel}
        aria-describedby="domain-map-desc"
        viewBox={`${vb.minX} ${vb.minY} ${vb.width} ${vb.height}`}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid meet"
        className="block"
      >
        <desc id="domain-map-desc">{desc}</desc>

        {/* Edges */}
        <g aria-hidden="true">
          {links.map((l, i) => {
            const s = byId.get(l.source);
            const t = byId.get(l.target);
            if (!s || !t) return null;
            return (
              <line
                key={`link-${i}`}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke="var(--color-border)"
                strokeWidth={0.6}
              />
            );
          })}
        </g>

        {/* Nodes */}
        {positioned.map((n) => {
          const dimmed = dimmedIds?.has(n.id) ?? false;
          const fill = `var(--color-chart-${n.hue})`;
          const opacity = dimmed ? 0.2 : 1;
          const baseFillOpacity = fillOpacityFor(n.kind);
          const fontSize = n.kind === "domain" ? 11 : n.kind === "subdomain" ? 9 : 8;
          const labelDy = n.radius + fontSize + 1;

          const circle = (
            <>
              <circle
                cx={n.x}
                cy={n.y}
                r={n.radius}
                fill={fill}
                fillOpacity={baseFillOpacity}
                stroke={fill}
                strokeWidth={n.kind === "domain" ? 1.5 : 1}
              >
                <title>
                  {n.label} — composite {n.composite.toFixed(2)}
                </title>
              </circle>
              <text
                x={n.x}
                y={n.y + labelDy}
                textAnchor="middle"
                fontSize={fontSize}
                fill="var(--color-foreground)"
                fontFamily="var(--font-sans)"
                pointerEvents="none"
              >
                {n.label}
              </text>
            </>
          );

          const inner = n.href ? (
            <a
              href={n.href}
              aria-label={`${n.label}, composite rating ${n.composite.toFixed(2)}`}
              style={{ opacity }}
            >
              {circle}
            </a>
          ) : (
            <g style={{ opacity }}>{circle}</g>
          );

          return (
            <g key={n.id} data-node-id={n.id} data-node-kind={n.kind}>
              {inner}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
