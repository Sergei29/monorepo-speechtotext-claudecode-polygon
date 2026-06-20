LLM Web Test

About the task

- This test focuses on your ability to use LLMs to solve problems.
- Time limit: 90 minutes. LLM and AI tool usage is permitted. All existing E2E tests must pass when you're done.
- Scope: You may only modify files under apps/client-user/ and packages/proto/. Do not touch the API. Study the codebase before writing code; follow its conventions for styling, state, server communication, and components. Do not install new dependencies unless necessary. Every task requires E2E tests; stub server functions for mock data where the API does not exist yet.
  How to Schedule
- Answer Some Quick Questions to help us understand you better
- Connect your GitHub account so we can verify your username
- Select a suitable date and time
- Click on the "Schedule Test" button
- Visit this link at the scheduled time and you will be redirected to the test page.
- Note: You can only access the test within 30 minutes of scheduled date and time
  Timings
- You will have 90 minutes in total to complete the task.
- Note: You must push your code to the repo within those 90 minutes, as your access will be revoked after the test runs out of time.

### Before start:

⚠️ ⏳ Set watch timer for 80 minutes.

### Step 1: Environment & Guardrails (Minute 0–5)

```sh
 /init
```

```sh
CRITICAL OPERATIONAL RULES FOR THIS SESSION:
1. You may ONLY create, read, or modify files located under `apps/client-user/` and `packages/proto/`.
2. Do NOT touch, modify, or reference any backend API directories (`apps/api`, etc.) or external packages outside this sandbox.
3. Read the project's root AGENTS.md or llms.txt if present to synchronize with the workspace layout.
Acknowledge these rules, then run the existing E2E tests for the client app using the appropriate pnpm filter command to verify everything passes out of the box.
```

### Step 2: Data Schema Definition (Minute 5–20)

Before touching the UI. Define the data contracts in the proto package.

```sh
/plan "Inside `packages/proto/`, analyze the existing schema definitions. We need to add/modify data contracts to support our new feature: [Insert Feature Name].
1. Define the new message structures or schemas following the exact patterns of the existing proto files.
2. Run the monorepo's compilation/build script for the proto package so the new TypeScript interfaces are generated and available to the workspace.
Do not modify any other packages yet. Present your schema plan first."
```

If no pre-commit checks, Manually run format, lint, type checks and build application,
Then Commit and Push

### Step 3: Server Function Stubbing & UI Layout (Minute 20–60)

This merges your state, stubs, and UI layout into a single unified execution loop inside your allowed client application directory.

```sh
/plan "Inside `apps/client-user/`, we are going to implement the complete feature for [Insert Feature Name]. Follow these strict rules:
1. DATA LAYER STUBS: Create or modify the meta-framework Server Functions / Server Actions to handle data retrieval and mutations for this feature. Use the generated TypeScript types from `packages/proto/`. Because the backend API does not exist yet, STUB the data returns directly inside these server functions with realistic mock arrays and a 1000ms simulated latency (`setTimeout`).
2. UI & STATE: Build the frontend UI components to consume these server functions. Ensure the UI gracefully handles the full state lifecycle: Input Validation -> Loading State/Spinners -> Success Render OR Error Alert Banners.
3. PARADIGM ALIGNMENT: Mirror the exact file structures, naming conventions, styling library (Tailwind/CSS modules), and state patterns already used in the client app.
Present your file implementation plan for my review before writing any code."
```

If no pre-commit checks, Manually run format, lint, type checks and build application,
Then Commit and Push

### Step 4: E2E Test Implementation & Validation (Minute 60–80)

```sh
/plan "Now that the feature is functioning with our server stubs, locate the existing E2E testing framework inside `apps/client-user/` (Playwright/Cypress).
1. Write a new companion E2E test file that completes a full happy-path user flow for our new feature (entering data, submitting, waiting for loading, verifying successful state changes).
2. Run the workspace lint, format, and compilation commands to guarantee zero type errors.
3. Execute the E2E test suite using the project's specific pnpm filter command. Iterate and fix any selector or timing failures until all tests pass perfectly clean."
```

If no pre-commit checks, Manually run format, lint, type checks and build application,
Then Commit and Push

### Step 5: Final Sanity Check & Push (Minute 80–90)

Final manual QA, final Commit and Push if needed
Verify line-by-line that no files outside apps/client-user/ and packages/proto/ were touched.
