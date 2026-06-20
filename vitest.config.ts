import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, defineProject } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      defineProject({
        test: {
          name: "speechify-client",
          include: ["packages/speechify-client/src/**/*.test.ts"],
          environment: "node",
        },
      }),
      defineProject({
        plugins: [react()],
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "apps/web/src"),
          },
        },
        test: {
          name: "web",
          include: ["apps/web/src/**/*.test.{ts,tsx}"],
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
        },
      }),
    ],
  },
});
