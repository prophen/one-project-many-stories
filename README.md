# One Project, Many Stories

A focused local editorial workspace for developers and freelancers who repeatedly explain the same project to different audiences. Built October 18, 2026 for the Hacktoberfest Week 2 **Side Hustle** prompt. Buyer interest and willingness to pay are hypotheses, not validated findings.

## Run

Requires Node 22.12+ (tested with Node 26), npm, and Ollama for AI generation.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5188. The app binds to loopback. The Vite development server includes the local model API; `dist/` alone is only a frontend, not a working inference deployment.

For generation, start your existing Ollama runtime (`ollama serve`) and install an open-weight instruction model of your choice **after checking its license, download size, available storage, and memory requirements**. The app never downloads models. Click **Check connection**, select an installed model, fill the three required fields, and click **Shape three stories**. Ollama must be available at `http://127.0.0.1:11434`; remote endpoints and cloud model aliases are rejected. No API keys are needed.

Current verification environment: Ollama responds with an empty model list. **Real-model generation is not yet tested.** The smallest remaining decision is which local open-weight model to install, or where an existing model is located. A successful build or mocked UI test does not establish real AI functionality.

## What it does

Capture project name, audience/problem, personal contribution, implemented features, stack, tradeoffs, verified outcomes, and optional evidence URLs. The clearly labeled Patchwork example is entirely synthetic. It is input data, never a pre-generated AI success.

A local model returns a compact plan of source IDs, not echoed or paraphrased prose. The server validates audience-specific contracts and the renderer resolves complete original passages, preserving qualifications:

- **Case study:** separate problem, personal contribution, implementation, tools/skills, decisions/tradeoffs, and reported-outcome sections; missing sections explicitly say unknown, followed by evidence status.
- **Hiring summary:** contribution first, relevant skills, and reported result. Those three source fields have a combined 140-word budget. Oversized input is rejected with a request to shorten it yourself; no qualifications are automatically removed. Total output adds short labels/review text.
- **Demo:** add up to five optional screen actions, assign each a narration source, and explicitly confirm you can show it and that the narration is accurate. The model sequences only those confirmed actions. Editing action text, its source assignment, or linked fact clears confirmation. Without confirmed actions, the output reports no sequence and offers a preparation suggestion, clearly separated from demo steps.

This is **source-preserving assembly, not free paraphrasing**. The AI chooses the ordering of required source material and confirmed demo actions. Structural distinctions are enforced; persuasive writing quality and semantic factuality are not guaranteed. The synthetic sample has no pre-confirmed actions.
Edit all three drafts, copy the complete bundle, or download UTF-8 text. Exports include the source snapshot, missing fields, and review status. Editing notes marks old drafts stale; editing drafts marks them for review. All content lives in memory until refresh or closing the tab. Download before leaving if needed.

## Architecture

- React + TypeScript + CSS, built with Vite. No UI framework, remote fonts, analytics, authentication, billing, database, or remote persistence.
- `src/domain.ts`: input validation, strict fact-ID plan parser, system/user prompt separation, source-linked formatting and export.
- `src/adapter.ts`: injectable fetch adapter to Ollama `/api/tags`, `/api/show`, and `/api/chat`; JSON output, deterministic temperature, bounded generation, timeouts, no redirects, and local-model checks. No tool execution.
- `vite.config.ts`: loopback development API, origin check, body limits, errors without raw upstream logs. User text is rendered as plain React text and textarea values. Never HTML, executable Markdown, or browser instructions.
- The intended open-weight integration plans source ordering and confirmed demo sequencing; this integration is not yet validated with a real model. There is no canned generation fallback. The app is usable for collecting facts while disconnected, but cannot generate stories until a model is connected.

## Guardrails and limits

The parser accepts only the required source IDs and confirmed action IDs, rejecting freeform model text, missing required sections, duplicate IDs, wrong action/source links, malformed responses, and oversized input/output. This prevents freeform model claims from entering initial assembled drafts but **does not verify the truth of user notes**, prove relevance, or prevent misleading selection/omission. Manual edits are unvalidated and always flagged. Prompts are defense in depth, not a security guarantee. Text and evidence URLs are untrusted; URLs are never automatically fetched or rendered as clickable links. Exports remain untrusted text, especially if copied into another AI tool.

This is a local prototype, not a hardened hosted service. Do not expose the Vite server publicly. Ollama itself may have its own runtime memory/log behavior; this app makes no persistence guarantees about separately installed software. Model identity/license and writing quality must be checked before recording a challenge demo. Freeform narrative rewriting remains outside this version. Screen choreography is user-authored and user-confirmed; neither a checkbox nor source-ID validation proves that an action exists or that its narration is accurate.

## Verification

```sh
npm test          # 19 unit/adapter tests; fake transport, no real inference
npm run build    # strict TypeScript and production frontend build
npm run test:ui  # Chrome browser; local server starts automatically
```

Browser tests use installed Google Chrome (`channel: chrome`). They cover disconnected setup, sample input, tabs, mobile overflow, generation errors, edited drafts, stale snapshots, downloads, and confirmation invalidation after action/source edits. Generated-response UI tests are explicitly mocked. Screenshots of the real interface (with offline transport mocked) are written to `screenshots/desktop.png` and `screenshots/mobile.png`.

## Challenge handoff

Challenge: https://dev.to/challenges/hacktoberfest-week2-2026-10-12

The challenge emphasizes a specific paid-use hypothesis, open AI at the core, and writing quality. Before submission: choose/install a model, test generation with the synthetic sample, inspect all three real outputs, record a working demo, choose a repository license, and write an honest DEV post describing the source-preserving design and limitations. Publishing this source does not establish a working AI demo. No deployment, DEV post, or challenge submission has been completed. No payment or user-adoption claims have been established.

## If the local preview is unavailable

Run `npm run dev` in this project and keep that terminal running. Wait for Vite's **Local: http://127.0.0.1:5188/** ready message before opening the URL. Cold startup and development asset loading may take time; the page includes a startup status. The server must be restarted after its process exits or the computer restarts. Do not stop other projects if this port is occupied. Missing models only disable generation; the facts interface still renders.

## Model and publication status

No model weights are included. The development environment had no configured models at the latest verification. There is **no Google-hosted Gemma integration** or other hosted inference provider. No credentials are required or included. Real-model output quality, latency, and reliability remain untested. Tests use explicit fixtures, never a runtime fallback. This repository has not yet selected a project license; public visibility alone is not an open-source license grant.
