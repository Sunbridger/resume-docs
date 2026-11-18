import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 使用相对 base，产物可直接部署到任意 GitHub Pages 子路径
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 1200,
  },
});
