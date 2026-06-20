import { test, expect } from "@playwright/test";

// Mock /api/tts for every test so no real Speechify audio stream ever reaches
// the browser — this matters when reuseExistingServer picks up a dev server
// that wasn't started with SPEECHIFY_MOCK_MODE=true. Real audio binary streams
// arriving during Playwright's --ui trace finalization corrupt the screenshot
// stream ("file data stream has unexpected number of bytes").
// Routes are LIFO, so any test-level page.route("/api/tts", ...) registered
// afterwards will take precedence over this global fallback.
test.beforeEach(async ({ page }) => {
  await page.route("/api/tts", (route) =>
    route.fulfill({
      status: 200,
      contentType: "audio/mpeg",
      headers: { "X-Mock-Mode": "true", "Cache-Control": "no-store" },
    })
  );
});

// Give the page 400 ms to drain any in-flight network activity and finish
// pending React renders before Playwright finalizes the trace for --ui mode.
// Without this, a DOM mutation (e.g. audio player appearing after a server
// action completes) can arrive mid-screenshot and corrupt the trace stream.
test.afterEach(async ({ page }) => {
  await page.waitForTimeout(400);
});

test.describe("Streaming TTS page", () => {
  test("renders heading and subtitle", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Text to Speech" })).toBeVisible();
    await expect(page.getByText("Streaming · audio plays as it arrives")).toBeVisible();
  });

  test("mounts audio player and calls TTS API with submitted text", async ({ page }) => {
    // Override the global beforeEach mock to also capture the request body.
    // LIFO ordering means this handler runs first; the beforeEach fallback is
    // never reached for /api/tts in this test.
    let capturedBody: { text: string } | undefined;
    await page.route("/api/tts", async (route) => {
      const raw = route.request().postData();
      if (raw) capturedBody = JSON.parse(raw);
      await route.fulfill({
        status: 200,
        contentType: "audio/mpeg",
        headers: { "X-Mock-Mode": "true", "Cache-Control": "no-store" },
      });
    });

    await page.goto("/");
    await page.getByRole("textbox").fill("Hello world");
    await page.getByRole("button", { name: "Convert to Speech" }).click();

    await expect(page.locator("audio")).toBeVisible();
    await expect.poll(() => capturedBody, { timeout: 5000 }).toEqual({ text: "Hello world" });
  });
});

test.describe("Text to Speech page", () => {
  test("renders heading and subtitle", async ({ page }) => {
    await page.goto("/text-to-speech");
    await expect(page.getByRole("heading", { name: "Text to Speech" })).toBeVisible();
    await expect(
      page.getByText("Server action · full audio returned before playback")
    ).toBeVisible();
  });

  test("shows loading state while server action is pending", async ({ page }) => {
    await page.goto("/text-to-speech");
    await page.getByRole("textbox").fill("Hello world");
    await page.getByRole("button", { name: "Convert to Speech" }).click();

    // React 19's useActionState sets isPending=true synchronously (via startTransition)
    // before the fetch fires, so "Generating..." is already rendered when click() returns.
    await expect(page.getByRole("button", { name: "Generating..." })).toBeVisible();

    // Wait for the action to settle so the page is stable when the afterEach
    // drain runs and Playwright finalizes the trace.
    await expect(page.getByRole("button", { name: "Convert to Speech" })).toBeVisible({
      timeout: 15000,
    });
  });
});

test.describe("Navbar navigation", () => {
  test("navigates from home to text-to-speech page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Text to Speech" }).click();
    await expect(page).toHaveURL("/text-to-speech");
  });

  test("navigates from text-to-speech back to streaming page", async ({ page }) => {
    await page.goto("/text-to-speech");
    await page.getByRole("link", { name: "Streaming" }).click();
    await expect(page).toHaveURL("/");
  });
});
