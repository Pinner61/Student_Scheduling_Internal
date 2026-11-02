import { easeCubicOut } from "d3-ease";
import { select, type Selection } from "d3-selection";
import "d3-transition";
import { PATHWAY_VIEW, pathwayNodes } from "./layout";

type SvgSel = Selection<SVGSVGElement, unknown, null, undefined>;

export interface PathwayController {
  setStage(index: number, animate: boolean): void;
  destroy(): void;
}

export function createPathway(svg: SVGSVGElement): PathwayController {
  const root: SvgSel = select(svg);
  root.attr("viewBox", `0 0 ${PATHWAY_VIEW.width} ${PATHWAY_VIEW.height}`);
  const y = PATHWAY_VIEW.y;
  const xs = [...pathwayNodes];

  root
    .append("line")
    .attr("class", "path-base")
    .attr("x1", xs[0] ?? 0)
    .attr("x2", xs[xs.length - 1] ?? 0)
    .attr("y1", y)
    .attr("y2", y);

  const progress = root
    .append("line")
    .attr("class", "path-progress")
    .attr("x1", xs[0] ?? 0)
    .attr("y1", y)
    .attr("y2", y)
    .attr("x2", xs[0] ?? 0);

  const nodes = root
    .selectAll<SVGGElement, number>("g.year-node")
    .data(xs)
    .join("g")
    .attr("class", "year-node")
    .attr("transform", (x) => `translate(${x},${y})`);

  nodes.append("circle").attr("class", "year-ring").attr("r", 16);
  nodes.append("circle").attr("class", "year-core").attr("r", 6.5);

  return {
    setStage(index: number, animate: boolean) {
      const safe = Math.max(0, Math.min(xs.length - 1, index));
      const x = xs[safe] ?? xs[0] ?? 0;
      progress.interrupt();
      if (animate) progress.transition().duration(520).ease(easeCubicOut).attr("x2", x);
      else progress.attr("x2", x);
      nodes.classed("is-active", (_, nodeIndex) => nodeIndex === safe);
      nodes.classed("is-complete", (_, nodeIndex) => nodeIndex < safe);
    },
    destroy() {
      root.selectAll("*").interrupt();
      root.selectAll("*").remove();
    },
  };
}
