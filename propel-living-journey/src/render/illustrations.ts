import type { StageId } from "../types";
import { escapeHtml } from "./escape";

const figures: Record<StageId, string> = {
  infrastructure: `
    <path class="draw" pathLength="1" data-step="0" d="M140 28 V148"></path>
    <path class="draw" pathLength="1" data-step="1" d="M48 96 H232"></path>
    <path class="draw" pathLength="1" data-step="2" d="M64 120 H216"></path>
    <path class="draw" pathLength="1" data-step="3" d="M80 144 H200"></path>
    <path class="draw" pathLength="1" data-step="4" d="M96 168 H184"></path>
    <g data-step-mark="0"><circle class="node-ring" cx="140" cy="28" r="7"></circle><circle class="node-core" cx="140" cy="28" r="3"></circle></g>`,
  expansion: `
    <path class="draw" pathLength="1" data-step="0" d="M140 24 V168"></path>
    <path class="draw" pathLength="1" data-step="1" d="M140 64 C96 58 62 50 36 60"></path>
    <path class="draw" pathLength="1" data-step="2" d="M140 88 C186 78 220 70 250 88"></path>
    <path class="draw" pathLength="1" data-step="3" d="M140 124 C184 138 214 152 244 166"></path>
    <path class="draw" pathLength="1" data-step="4" d="M72 188 H208"></path>
    <g data-step-mark="0"><circle class="node-ring" cx="140" cy="24" r="6"></circle><circle class="node-core" cx="140" cy="24" r="2.5"></circle></g>
    <g data-step-mark="1"><circle class="node-ring" cx="36" cy="60" r="5"></circle><circle class="node-core" cx="36" cy="60" r="2"></circle></g>
    <g data-step-mark="2"><circle class="node-ring" cx="250" cy="88" r="5"></circle><circle class="node-core" cx="250" cy="88" r="2"></circle></g>
    <g data-step-mark="3"><circle class="node-ring" cx="244" cy="166" r="5"></circle><circle class="node-core" cx="244" cy="166" r="2"></circle></g>`,
  implementation: `
    <path class="draw" pathLength="1" data-step="0" d="M140 24 V150"></path>
    <path class="draw" pathLength="1" data-step="1" d="M140 68 C98 60 64 54 38 62"></path>
    <path class="draw" pathLength="1" data-step="1" d="M38 62 L248 90"></path>
    <path class="draw" pathLength="1" data-step="2" d="M140 90 C186 80 222 74 248 90"></path>
    <path class="draw" pathLength="1" data-step="2" d="M248 90 L242 166"></path>
    <path class="draw" pathLength="1" data-step="3" d="M140 122 C186 138 214 154 242 166"></path>
    <path class="draw" pathLength="1" data-step="3" d="M242 166 L38 62"></path>
    <path class="draw" pathLength="1" data-step="3" d="M242 166 L140 148"></path>
    <g data-step-mark="0"><circle class="node-ring" cx="140" cy="24" r="6"></circle><circle class="node-core" cx="140" cy="24" r="2.5"></circle></g>
    <g data-step-mark="1"><circle class="node-ring" cx="38" cy="62" r="5"></circle><circle class="node-core" cx="38" cy="62" r="2"></circle></g>
    <g data-step-mark="2"><circle class="node-ring" cx="248" cy="90" r="5"></circle><circle class="node-core" cx="248" cy="90" r="2"></circle></g>
    <g data-step-mark="3"><circle class="node-ring" cx="242" cy="166" r="5"></circle><circle class="node-core" cx="242" cy="166" r="2"></circle></g>`,
};

export function stageFigure(id: StageId, caption: string, figureNumber: string): string {
  return `<figure class="chapter-figure">
    <svg class="illus" viewBox="0 0 280 220" aria-hidden="true">${figures[id]}</svg>
    <figcaption data-piece data-step="0"><span>${escapeHtml(figureNumber)}</span> ${escapeHtml(caption)}</figcaption>
  </figure>`;
}
