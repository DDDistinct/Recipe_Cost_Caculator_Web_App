import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: "/Recipe_Cost_Caculator_Web_App/", //← should match GitHub repo name of project
  server: {
    port: 3000,
    open: true,
  },
});
