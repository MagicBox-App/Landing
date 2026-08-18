# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

"Fiesta Feliz" / **Magic Box** — an internal quotation panel for a children's party-services business (Lima, Peru). No build step: plain HTML/CSS/JS served statically. Spanish is the language of all UI text, comments, and content.

The repo currently contains **two parallel, unconnected implementations**:

1. **`_preview_prototipo.html`** — a single self-contained HTML file (inline `<style>` + one `<script>` block near the end of the file) with its own local color tokens and demo data. This is the **approved landing page** currently being iterated on. `vercel.json` routes `/` to this file, not `index.html`.
2. **Modular app** (`index.html` + `js/*.js` + `css/styles.css`) — the original architecture wired to Firebase/Firestore (see below). `catalogo-magic-box.md` documents that real catalog data is meant to eventually replace the demo content in `js/data.js`.

When asked to change "the site" or "the landing," confirm which of the two the user means — changes to one do not affect the other.

## Commands

Static site, no package manager scripts. Run a local server directly:

```bash
python -m http.server 8934
```

(This matches the `static` launch config in `.claude/launch.json`.) Then open `http://localhost:8934/` for the routed prototype, or `http://localhost:8934/index.html` for the modular app.

Deployment is via Vercel (`vercel.json` — routes `/` to `_preview_prototipo.html`, everything else falls through to the filesystem).

There is no lint, test, or build tooling in this repo.

## Architecture (modular app: `index.html` + `js/`)

Load order matters (classic scripts, no bundler): `js/icons.js` → `js/data.js` → `js/firebase.js` (ES module) → `js/firestore-service.js` (ES module) → `js/app.js` → `js/admin.js` → `js/chatbot.js` → `js/auth-gate.js`.

- **`js/firebase.js`** — the only file with Firebase project config. If `firebaseConfig.apiKey` is still the placeholder `'TU_API_KEY'`, the app runs in **`window.DEMO_MODE`**: no real Firebase calls, everything falls back to `localStorage`. This lets the UI be demoed with zero backend setup.
- **`js/firestore-service.js`** — the single data-access boundary. It exports `window.firestoreService` with the *same* method signatures in both branches (demo/localStorage vs. real Firestore), so `app.js`/`admin.js`/`chatbot.js` never know or care which backend is active.
- **`js/auth-gate.js`** — login is by phone number + SMS code (Firebase Phone Auth), not email/password, since the sole user is the non-technical shop owner. In demo mode it skips straight to `showApp()`. On real auth success it calls `window.initAppData()` (defined in `app.js`) exactly once.
- **`js/app.js`** — holds the in-memory mirror of state (`state`, `CATALOG`) kept live by Firestore listeners started in `initAppData()`; renders the catalog/order UI; generates proforma/contract documents and CSV export client-side.
- **`js/admin.js`** — in-place catalog editing (add/edit/delete categories & items) layered onto the same screens via a `editMode` flag, reusing the modal pattern from `app.js`'s `#docModal`.
- **`js/chatbot.js`** — rule-based/keyword-matching conversational assistant (not an LLM) that calls the same `addItemToOrder()` used by the click UI, so chat and clicks share one order state. Comments in the file note this is meant to be swapped for a real WhatsApp-connected agent in a later phase.
- **`js/data.js`** — `SEED_CATALOG`, used only to seed Firestore/localStorage the first time (`firestoreService.seedCatalogIfEmpty`); after that, Firestore (or localStorage in demo mode) is the source of truth and the owner edits it live via `js/admin.js`.
- **`firestore.rules`** — all collections (`catalog_categories`, `catalog_items`, `state`, `order_history`) require `request.auth != null`; everything else is denied by default.

## Repo notes

- This GitHub repo (`joshua-builds/FIESTA`) is **public** — never commit banking/payment details or credentials. `catalogo-magic-box.md` contains real product prices, which is fine, but keep anything account/credential-related out of tracked files.
- Real Firebase credentials belong only in `js/firebase.js`, replacing the `'TU_API_KEY'`-style placeholders — until then the app stays in demo mode by design.
