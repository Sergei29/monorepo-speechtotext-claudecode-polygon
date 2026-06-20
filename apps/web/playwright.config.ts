import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "fs";
import { resolve } from "path";

const nvmrc = readFileSync(resolve(__dirname, "../../.nvmrc"), "utf8").trim();
const requiredMajor = parseInt(nvmrc.replace("v", "").split(".")[0]);
const currentMajor = parseInt(process.versions.node.split(".")[0]);
if (currentMajor !== requiredMajor) {
  throw new Error(
    `Wrong Node.js version: .nvmrc requires ${nvmrc} (major ${requiredMajor}), ` +
      `got v${process.versions.node}. Run 'nvm use'.`
  );
}

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      // Prevent real Speechify API calls during E2E tests.
      // The server will return mock audio without requiring an API key.
      SPEECHIFY_MOCK_MODE: "true",
    },
  },
});
