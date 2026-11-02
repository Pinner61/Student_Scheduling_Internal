import { mountPropelJourney } from "./mount";

export { mountPropelJourney };

declare global {
  interface Window {
    PropelJourney?: {
      mount: typeof mountPropelJourney;
    };
  }
}

const api = { mount: mountPropelJourney };
window.PropelJourney = api;

function start() {
  document.querySelectorAll<HTMLElement>("[data-propel-journey]").forEach((element) => {
    mountPropelJourney(element);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
