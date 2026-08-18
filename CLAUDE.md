# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

"Fiesta Feliz" / **Magic Box** — a quotation tool for a children's party-services business (Lima, Peru). No build step and no framework: plain HTML/CSS/JS served statically, plus one Node serverless function. Spanish is the language of all UI text, comments, and content.

The repo contains **two parallel, unconnected implementations**:

1. **`_preview_prototipo.html`** — a single self-contained file (inline `<style>`, one `<script>` IIFE starting around line 1176) with its own color tokens, `CATALOG` data, and image maps. This is the **approved, actively-developed landing**; `vercel.json` and `dev-server.js` both route `/` here, not to `index.html`.
2. **Modular app** (`index.html` + `js/*.js` + `css/styles.css`) — the original Firebase/Firestore architecture. Still present but not what the deployed site serves.

When asked to change "the site" or "the landing," assume `_preview_prototipo.html` unless told otherwise — changes to one implementation do not affect the other.

## Commands

```bash
node dev-server.js
```

This is the correct dev command: it serves static files **and** runs `api/chat.js` at `POST /api/chat`, mimicking Vercel's function runtime (`req.body`, `res.status().json()`). It also loads `.env` via dotenv, so the chat assistant works locally. Listens on `PORT` or 8934; `/` serves `_preview_prototipo.html`.

`python -m http.server 8934` (the `static` config in `.claude/launch.json`) still works for pure-static browsing, but `/api/chat` will 404 and the chat assistant will fail — prefer `node dev-server.js`.

Deployment is Vercel (`vercel.json` routes `/` to `_preview_prototipo.html`, everything else falls through to the filesystem; `api/chat.js` is picked up automatically as a serverless function). There is no lint, test, or build tooling.

## Chat assistant (`api/chat.js`)

The client-facing assistant is the one piece of real backend. Everything about it lives in `api/chat.js`:

- It is the **only** place that talks to Gemini. The browser POSTs `{ message, history }` to `/api/chat` and never sees an API key.
- `CATALOG_SUMMARY` and `SYSTEM_INSTRUCTION` are hard-coded strings in that file — the assistant's persona (a white rabbit mascot, sales-oriented, must disclose it is an AI) and its price list. **Catalog price changes must be mirrored here manually**; nothing derives this from `js/data.js` or `catalogo-magic-box.md`.
- The assistant is consultative only: it recommends and quotes, but never mutates the order. Adding items stays with the normal buttons.
- **Key pool with failover**: `GEMINI_API_KEYS` is a comma-separated list. Keys are shuffled, tried 5 at a time in parallel via `Promise.any` with an 8s per-key abort, falling through to the next batch — so a rate-limited or hung key doesn't block the request. `GEMINI_API_KEY` (singular) is accepted as a fallback.
- Set `GEMINI_API_KEYS` in `.env` locally and in Vercel's environment variables for production.

### Legacy client-side Gemini path (do not extend)

`js/chatbot.js`, `js/env-loader.js`, and `config.js` implement an older approach where `window.GEMINI_API_KEY` is exposed **in the browser**. `config.js` is gitignored and holds a real key on this machine. `ENV_SETUP.md` documents this older path and refers to Netlify, which is not where this deploys — treat that doc as stale. Any new AI work should go through `api/chat.js`.

## `_preview_prototipo.html` structure

One IIFE, organized by banner comments — grep for `=== ` to navigate:

- `PROTOTYPE STAGE SWITCHER` — `goStage('internal' | 'client')` toggles `#stage-internal` / `#stage-client`. The file demos **two products at once**: the owner's internal quoting panel and the customer-facing view.
- `PANEL INTERNO` — the owner's flow (`#view-catalog`, `#view-history`), category → item → quantity, running total, fuzzy search.
- `VISTA CLIENTE` — no login; the owner pre-loads the client name and shares a link. Has its own catalog/item views and a WhatsApp bubble.
- `ASISTENTE DE CHAT` — full-screen chat (`#chatFullscreen`) in the client view, POSTing to `/api/chat`. `matchCatalogItemsInText()` greps the model's reply for catalog item names to attach real photos (max 4); the model never picks images itself.
- `TOGGLE DE TEMA` — light/dark.

Images are wired by convention, not by data: `CAT_PHOTO[id] = 'img/cat/<id>.jpg'` and `PROD_PHOTO[id] = 'img/prod/<id>.jpg'` from hard-coded id lists. A new product needs its id added to the `PROD_PHOTO` list and a matching file in `img/prod/`. Single-item categories fall back to the category photo rather than repeating an image.

## Architecture (modular app: `index.html` + `js/`)

Load order matters (classic scripts, no bundler), per `index.html`: `js/icons.js` → `js/data.js` → `js/env-loader.js` → `config.js` → `js/app.js` → `js/chatbot.js` → `js/admin.js` → then the ES modules `js/firebase.js` → `js/firestore-service.js` → `js/auth-gate.js`.

- **`js/firebase.js`** — the only file with Firebase project config. While `firebaseConfig.apiKey` is the placeholder `'TU_API_KEY'`, the app runs in **`window.DEMO_MODE`**: no real Firebase calls, everything falls back to `localStorage`, so the UI demos with zero backend.
- **`js/firestore-service.js`** — the single data-access boundary. `window.firestoreService` exposes the *same* method signatures in both branches (demo/localStorage vs. real Firestore), so callers never know which backend is active.
- **`js/auth-gate.js`** — login is phone number + SMS code (Firebase Phone Auth), not email/password, since the sole user is the non-technical shop owner. Demo mode skips to `showApp()`. On real auth success it calls `window.initAppData()` (in `app.js`) exactly once.
- **`js/app.js`** — in-memory mirror of state (`state`, `CATALOG`) kept live by Firestore listeners; renders catalog/order UI; generates proforma/contract documents and CSV export client-side.
- **`js/admin.js`** — in-place catalog editing layered onto the same screens via an `editMode` flag, reusing `app.js`'s `#docModal` pattern.
- **`js/chatbot.js`** — rule-based keyword matcher that calls the same `addItemToOrder()` as the click UI, so chat and clicks share one order state. Unrelated to `api/chat.js`.
- **`js/data.js`** — `SEED_CATALOG`, used only by `firestoreService.seedCatalogIfEmpty` on first run; after that the store is the source of truth and the owner edits it live via `js/admin.js`.
- **`firestore.rules`** — `catalog_categories`, `catalog_items`, `state`, `order_history` all require `request.auth != null`; everything else denied.

## Reference documents

- **`catalogo-magic-box.md`** — the real Magic Box products and prices, extracted from the print catalog PDF. The source of truth when updating prices anywhere.
- **`PROMPT_ANTIGRAVITY_FRONTEND.md`** — the original design brief (business context, the owner's WhatsApp-and-Word workflow, the seven things the internal panel must do). Useful when a UI decision needs its "why."

## Repo notes

- The GitHub repo (`joshua-builds/FIESTA`) is **public**. `config.js`, `.env`, and `.vercel` are gitignored and hold real keys — keep them that way; never inline a Gemini or Firebase key into `_preview_prototipo.html`, `index.html`, or any tracked file.
- Real Firebase credentials belong only in `js/firebase.js`, replacing the `'TU_API_KEY'` placeholders — until then the modular app stays in demo mode by design.
