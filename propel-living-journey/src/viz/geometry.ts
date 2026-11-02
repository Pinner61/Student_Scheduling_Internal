import { curveCatmullRom, curveCatmullRomClosed, curveLinear, line } from "d3-shape";
import { scaleLinear } from "d3-scale";

export interface Point {
  x: number;
  y: number;
}

const linear = line<Point>()
  .x((d) => d.x)
  .y((d) => d.y)
  .curve(curveLinear);

const living = line<Point>()
  .x((d) => d.x)
  .y((d) => d.y)
  .curve(curveCatmullRom.alpha(0.5));

const livingClosed = line<Point>()
  .x((d) => d.x)
  .y((d) => d.y)
  .curve(curveCatmullRomClosed.alpha(0.5));

export function linearPath(points: Point[]): string {
  return linear(points) ?? "";
}

export function livingPath(points: Point[]): string {
  return living(points) ?? "";
}

export function closedPath(points: Point[]): string {
  return livingClosed(points) ?? "";
}

/** Used by the scroll model to map a 0–1 segment onto path length. */
export const segmentScale = scaleLinear();

export const journeyView = {
  width: 480,
  height: 700,
  viewBox: "0 0 480 700",
};

/** Origin, year one, year two, year three, open end. */
export const journeySpine: Point[] = [
  { x: 128, y: 36 },
  { x: 128, y: 168 },
  { x: 168, y: 348 },
  { x: 124, y: 536 },
  { x: 146, y: 668 },
];

export const stageNodePoints: Point[] = [
  journeySpine[1],
  journeySpine[2],
  journeySpine[3],
];

/** Fallback fractions if the browser cannot measure the rendered path. */
export const STAGE_FRACTION_FALLBACK = [0.21, 0.49, 0.78];

export const expansionBranches: Point[][] = [
  [
    journeySpine[2],
    { x: 280, y: 268 },
    { x: 392, y: 246 },
  ],
  [
    journeySpine[2],
    { x: 310, y: 352 },
    { x: 408, y: 368 },
  ],
  [
    journeySpine[2],
    { x: 286, y: 430 },
    { x: 368, y: 456 },
  ],
];

/** Short labels for the year-two branches. They name supports already in the roadmap. */
export const expansionBranchLabels = ["Tiers", "Communities", "Coaches"];

export const expansionEnds: Point[] = expansionBranches.map((branch) => branch[branch.length - 1]);

export const flourishingLinks: Point[][] = expansionEnds.map((end) => [end, journeySpine[3]]);

export function journeySpinePath(): string {
  return livingPath(journeySpine);
}

export function foundationMarks(): string[] {
  const y = journeySpine[1].y;
  const x = journeySpine[1].x;
  return [
    linearPath([
      { x: x - 72, y: y + 42 },
      { x: x + 72, y: y + 42 },
    ]),
    linearPath([
      { x: x - 54, y: y + 56 },
      { x: x + 54, y: y + 56 },
    ]),
    linearPath([
      { x: x - 36, y: y + 70 },
      { x: x + 36, y: y + 70 },
    ]),
  ];
}

export function heroView() {
  return { viewBox: "0 0 360 420" };
}

export function heroAxis(): string {
  return linearPath([
    { x: 180, y: 36 },
    { x: 180, y: 360 },
  ]);
}

export function heroMarks(): string[] {
  return [
    linearPath([
      { x: 96, y: 300 },
      { x: 264, y: 300 },
    ]),
    linearPath([
      { x: 116, y: 318 },
      { x: 244, y: 318 },
    ]),
    linearPath([
      { x: 136, y: 336 },
      { x: 224, y: 336 },
    ]),
  ];
}

export const overviewLine = linearPath([
  { x: 16, y: 4 },
  { x: 584, y: 4 },
]);

export interface PillarNode {
  id: string;
  x: number;
  y: number;
}

export function pillarLayout(ids: string[]): {
  viewBox: string;
  cx: number;
  cy: number;
  nodes: PillarNode[];
  spokes: string[];
  ring: string;
} {
  const cx = 320;
  const cy = 280;
  const radius = 168;
  const nodes = ids.map((id, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / ids.length;
    return {
      id,
      x: round(cx + radius * Math.cos(angle)),
      y: round(cy + radius * Math.sin(angle)),
    };
  });

  const spokes = nodes.map((node) => {
    const dx = node.x - cx;
    const dy = node.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    const start = 52 / len;
    const end = (len - 48) / len;
    return linearPath([
      { x: cx + dx * start, y: cy + dy * start },
      { x: cx + dx * end, y: cy + dy * end },
    ]);
  });

  const ring = livingClosed(nodes) ?? "";

  return { viewBox: "0 0 640 560", cx, cy, nodes, spokes, ring };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
