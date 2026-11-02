import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { renderExperience } from "./src/render/experience";

const root = dirname(fileURLToPath(import.meta.url));

function propelHtml(): Plugin {
  return {
    name: "propel-html",
    transformIndexHtml(html) {
      return html.replace("<!--PROPEL-->", renderExperience());
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
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: "assets/propel-journey.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/propel-journey.[ext]",
      },
    },
  },
});
