# One Project, Many Stories

A focused local editorial workspace for developers and freelancers who repeatedly explain the same project to different audiences. Built October 18, 2026 for the Hacktoberfest Week 2 **Side Hustle** prompt. Buyer interest and willingness to pay are hypotheses, not validated findings.

## Run

Requires Node 22.12+ (tested with Node 26), npm, and either a local Ollama model or a user-configured Gemini API key for AI generation.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5188. The app binds to loopback. The Vite development server includes the local model API; `dist/` alone is only a frontend, not a working inference deployment.

For generation, start your existing Ollama runtime (`ollama serve`) and install an open-weight instruction model of your choice **after checking its license, download size, available storage, and memory requirements**. The app never downloads models. Click **Check connection**, select an installed model, fill the three required fields, and click **Shape three stories**. Ollama must be available at `http://127.0.0.1:11434`; remote endpoints and cloud model aliases are rejected. No API keys are needed for Ollama. Google hosted mode requires a server-side key; see below.

The user has exercised hosted generation, but the revised prose-writing contract has not yet been verified end to end with a real model. Local inference also needs real-model testing. Google setup is user-controlled and no real key has been handled by the agent. A successful build or mocked UI test does not establish real AI functionality.

## What it does

Capture project name, audience/problem, personal contribution, implemented features, stack, tradeoffs, verified outcomes, and optional evidence URLs. The clearly labeled Patchwork example is entirely synthetic. It is input data, never a pre-generated AI success.

The selected model writes three audience-specific drafts from your notes:

- **Case study:** a portfolio narrative connecting the problem, personal contribution, implementation, decisions, and qualified outcome.
- **Hiring summary:** a contribution-led pitch of up to 180 words, emphasizing skills and demonstrated results while retaining relevant qualifications. The limit applies to the generated summary, not the source notes.
- **Demo:** newly written spoken narration paired with your exact confirmed screen actions. The model cannot add or change actions. Editing an action, its source assignment, or linked fact clears confirmation. Without confirmed actions, the demo asks you to add them; it does not invent a walkthrough.

Each generated paragraph carries separate source IDs. The **Review sources & qualifications** view shows the original AI passages alongside their supporting notes and a complete source snapshot. Source mappings are model-provided: structural validation cannot prove that the prose is faithful or that qualifications were retained. Review all claims, negations, uncertainties, and limitations before sharing. Missing facts are listed separately; evidence URLs are never fetched.

Edit any draft, copy all three stories, or download UTF-8 text. Copy and downloads contain only the project title and drafts, without source IDs, source snapshots, or review labels. Relevant qualifications belong in the writing itself. Editing notes marks drafts stale; manual edits warn that the original mappings may no longer apply. Content stays in memory until refresh or closing the tab.

## Architecture

- React + TypeScript + CSS, built with Vite. No UI framework, remote fonts, analytics, authentication, billing, database, or remote persistence.
- `src/domain.ts`: input validation, sourced-draft schema validation, system/user prompt separation, clean formatting and exports.
- `src/server/google.ts` and `src/server/provider-router.ts`: opt-in Google Gemma REST adapter, fixed model, explicit transmission consent, sanitized failures, and no automatic fallback. Server status exposes only key-present status, never the key.
- `src/adapter.ts`: injectable fetch adapter to Ollama `/api/tags`, `/api/show`, and `/api/chat`; JSON output, deterministic temperature, bounded generation, timeouts, no redirects, and local-model checks. No tool execution.
- `vite.config.ts`: loopback development API, origin check, body limits, errors without raw upstream logs. User text is rendered as plain React text and textarea values. Never HTML, executable Markdown, or browser instructions.
- The open-weight integration writes audience-specific prose and sequences confirmed demo actions. The revised writing contract still needs real-model verification. There is no canned generation fallback. The app is usable for collecting facts while disconnected, but cannot generate stories until a model is connected.

## Guardrails and limits

The parser validates paragraph text and source IDs, required source coverage, summary length, distinct case-study/summary text, and exact confirmed demo action/source links. It rejects malformed responses, unknown or empty source references, extra fields, invented action IDs, duplicate actions, and oversized output. A single whole-response JSON Markdown fence is allowed; JSON is never extracted from surrounding prose or repaired. No canned output or automatic provider fallback is used.

These checks validate structure, **not semantic factual accuracy**. Rewriting can introduce unsupported implications or omit qualifications even with valid source references. Prompts require faithful paraphrasing and forbid invented claims; human review is necessary. Manual edits are unvalidated. Text is rendered as plain text; evidence URLs are untrusted and are not fetched.

This is a local prototype, not a hardened hosted service. Do not expose the Vite server publicly. Ollama itself may have its own runtime memory/log behavior; this app makes no persistence guarantees about separately installed software. Model identity/license and writing quality must be checked before recording a challenge demo. Narrative rewriting is now part of generation and needs human factual review. Screen choreography is user-authored and user-confirmed; neither a checkbox nor source-ID validation proves that an action exists or that its narration is accurate.

## Verification

```sh
npm test          # unit/adapter tests; fake transport, no real inference
npm run build    # strict TypeScript and production frontend build
npm run test:ui  # Chrome browser; isolated key-free server starts on port 5189
```

Hosted tests explicitly clear GEMINI_API_KEY for the test server and mock generation; they make no real Google requests. The browser test server uses port 5189 so it does not compete with the private hosted launcher on 5188. Browser tests use installed Google Chrome (`channel: chrome`). They cover disconnected setup, sample input, tabs, mobile overflow, generation errors, edited drafts, stale snapshots, downloads, and confirmation invalidation after action/source edits. Generated-response UI tests are explicitly mocked. Screenshots of the real interface (with offline transport mocked) are written to `screenshots/desktop.png` and `screenshots/mobile.png`.

## Challenge handoff

Challenge: https://dev.to/challenges/hacktoberfest-week2-2026-10-12

The challenge emphasizes a specific paid-use hypothesis, open AI at the core, and writing quality. Before submission: choose/install a model, test generation with the synthetic sample, inspect all three real outputs, record a working demo, and write an honest DEV post describing AI rewriting, source review, and limitations. Publishing this source does not establish a working AI demo. No deployment, DEV post, or challenge submission has been completed. No payment or user-adoption claims have been established.

## If the local preview is unavailable

Run `npm run dev` in this project and keep that terminal running. Wait for Vite's **Local: http://127.0.0.1:5188/** ready message before opening the URL. Cold startup and development asset loading may take time; the page includes a startup status. The server must be restarted after its process exits or the computer restarts. Do not stop other projects if this port is occupied. Missing models only disable generation; the facts interface still renders.

## Google hosted Gemma setup (optional)

The server-side REST adapter defaults to `gemma-4-26b-a4b-it`. Local Ollama remains the default selection. Google receives all submitted fact fields, evidence-link text, and demo actions only when you select hosted mode, approve the disclosure checkbox, and click **Send to Google & shape stories**. Editing notes clears consent. Free-tier prompts and responses may be used to improve Google products; use synthetic or public data for initial testing.

Google currently lists Gemma 4 input/output as free, with no paid tier listed. Project quotas and availability apply; this is not unlimited access. The app does not enable billing, switch models, retry with paid models, or automatically fall back to another provider.

Enter the key **yourself**, privately in Terminal:

1. Stop this app's existing preview server if it occupies port 5188. Do not stop unrelated processes.
2. From the project directory, run `zsh scripts/start-hosted.command`.
3. At the hidden input prompt, enter your own Gemini API key. The script exports `GEMINI_API_KEY` only for the server session. The secret is not typed as a shell command or saved to a file.
4. Open the local URL, select Google hosted Gemma, and load the synthetic example. Confirm readiness before any agent-assisted real API test. You can run the test yourself through the disclosure checkbox and generation button.

Do not paste a key into chat or this app. Never prefix it with `VITE_`. No `.env` file is created, read by the setup script, or overwritten; this setup uses the server process environment. Existing `.env` files are left intact. The agent has not read, generated, entered, or transmitted a real key. Closing the server ends this configuration; repeat the private prompt next time.

Official documentation: [Gemma on the Gemini API](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api), [Gemma pricing and data-use terms](https://ai.google.dev/gemini-api/docs/pricing#gemma-4).

## Model and publication status

Hosted integration is implemented and mock-tested; **real-model verification of the revised writing flow is still pending**. Local inference is also untested with a real model, and no local model was configured at the latest inspection. No model weights or credentials are included. Tests use explicit fixtures, never a runtime fallback. Repository: https://github.com/prophen/one-project-many-stories. Publication does not establish a working real-model demo. This project is licensed under the [MIT License](LICENSE). Copyright (c) 2026 Nikema Prophet. Model licenses and third-party dependency licenses remain separate.
