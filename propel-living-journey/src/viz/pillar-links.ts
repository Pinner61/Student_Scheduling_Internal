import { easeCubicOut } from "d3-ease";
import { select, type Selection } from "d3-selection";
import "d3-transition";
import { PILLAR_VIEW, pillarAnchors, pillarCenter, viewPoint } from "./layout";

type LineSel = Selection<SVGLineElement, (typeof pillarAnchors)[number], SVGSVGElement, unknown>;

export interface PillarLinksController {
  setActive(id: string, animate: boolean): void;
  destroy(): void;
}

export function createPillarLinks(svg: SVGSVGElement): PillarLinksController {
  const root = select(svg);
  root.attr("viewBox", `0 0 ${PILLAR_VIEW.width} ${PILLAR_VIEW.height}`);
  const center = viewPoint(pillarCenter.x, pillarCenter.y);
  const lines: LineSel = root
    .selectAll<SVGLineElement, (typeof pillarAnchors)[number]>("line")
    .data([...pillarAnchors])
    .join("line")
    .attr("class", (anchor) => `pillar-link pillar-link-${anchor.id}`)
    .attr("x1", center.x)
    .attr("y1", center.y)
    .attr("x2", (anchor) => viewPoint(anchor.x, anchor.y).x)
    .attr("y2", (anchor) => viewPoint(anchor.x, anchor.y).y)
    .attr("stroke", "#8C1D40")
    .attr("stroke-linecap", "round");

  return {
    setActive(id: string, animate: boolean) {
      lines.each(function paint(anchor) {
        const active = anchor.id === id;
        const line = select(this);
        line.interrupt();
        const stroke = active ? "#FFC627" : "#8C1D40";
        const width = active ? 5 : 2;
        const opacity = active ? 1 : 0.38;
        if (animate) {
          line.transition().duration(420).ease(easeCubicOut).attr("stroke", stroke).attr("stroke-width", width).attr("stroke-opacity", opacity);
          return;
        }
        line.attr("stroke", stroke).attr("stroke-width", width).attr("stroke-opacity", opacity);
      });
    },
    destroy() {
      root.selectAll("*").interrupt();
      root.selectAll("*").remove();
    },
  };
}
