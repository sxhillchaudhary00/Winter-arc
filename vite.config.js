import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" is required so the built app loads from file/capacitor inside the APK
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { outDir: "dist" },
});
