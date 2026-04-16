import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
// import fs from "fs";

export default defineConfig({
  base: "./",
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    host: "0.0.0.0", // 必须
    port: 5173
    // https: {
    //   key: fs.readFileSync('./192.168.31.213-key.pem'),
    //   cert: fs.readFileSync('./192.168.31.213.pem'),
    // }
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ["**/*.svg", "**/*.csv"]
});
