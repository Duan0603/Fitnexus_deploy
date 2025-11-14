import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

let target = (process.env.VITE_BACKEND_URL || "").trim();
if (!target) {
  target = "http://localhost:3001";
  console.warn("[env] VITE_BACKEND_URL missing. Falling back to http://localhost:3001 for dev proxy.");
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
