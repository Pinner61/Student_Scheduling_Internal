/** Shared coordinates for the pillar diagram and the year pathway. */

export const PILLAR_VIEW = { width: 1000, height: 420 };

export const pillarAnchors = [
  { id: "flourishing", x: 18, y: 27 },
  { id: "life-design", x: 82, y: 27 },
  { id: "analytics", x: 18, y: 73 },
  { id: "tiered-care", x: 82, y: 73 },
] as const;

export const pillarCenter = { x: 50, y: 50 };

export const PATHWAY_VIEW = { width: 900, height: 120, y: 64 };
export const pathwayNodes = [150, 450, 750] as const;

export function viewPoint(percentX: number, percentY: number): { x: number; y: number } {
  return {
    x: (percentX / 100) * PILLAR_VIEW.width,
    y: (percentY / 100) * PILLAR_VIEW.height,
  };
}
