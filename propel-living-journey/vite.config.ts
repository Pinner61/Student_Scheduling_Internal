import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { renderExperience } from "./src/render/experience";
import { renderTimeline } from "./src/render/timeline";

const root = dirname(fileURLToPath(import.meta.url));

function propelHtml(): Plugin {
  return {
    name: "propel-html",
    transformIndexHtml(html) {
      return html.replace("<!--PROPEL-->", renderExperience()).replace("<!--TIMELINE-->", renderTimeline());
    },
  };
}

export default defineConfig({
  root,
  base: "./",
  plugins: [propelHtml()],
  server: {
    port: 5173,
    strictPort: false,
  },
  preview: {
    port: 4173,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        index: resolve(root, "index.html"),
        timeline: resolve(root, "timeline.html"),
      },
      output: {
        entryFileNames(chunk) {
          return chunk.name === "timeline" ? "assets/propel-timeline.js" : "assets/propel-journey.js";
        },
        chunkFileNames: "assets/[name].js",
        assetFileNames(asset) {
          const name = asset.names?.join(" ") ?? "";
          return name.includes("timeline") ? "assets/propel-timeline.[ext]" : "assets/propel-journey.[ext]";
        },
      },
    },
  },
});
