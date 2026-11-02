import { mountPropelTimeline } from "./behavior/timeline";
import "./styles/timeline.css";

export { mountPropelTimeline };

declare global {
  interface Window {
    PropelTimeline?: {
      mount: typeof mountPropelTimeline;
    };
  }
}

const api = { mount: mountPropelTimeline };
window.PropelTimeline = api;

function start() {
  document.querySelectorAll<HTMLElement>("[data-propel-timeline]").forEach((element) => {
    mountPropelTimeline(element);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
