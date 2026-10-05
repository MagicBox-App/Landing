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

## Backend (`api/`)

Vercel functions; files starting with `_` are shared modules, not endpoints. `dev-server.js` mounts every other `api/*.js` at `/api/<name>` the same way.

- **`api/_gemini.js`** — the **only** place that talks to Gemini; shared by web chat and WhatsApp. Holds `CATALOG_SUMMARY` and `SYSTEM_INSTRUCTION` (white-rabbit persona, sales-oriented, must disclose it is an AI, never names the model). **Catalog price changes must be mirrored here manually.** `askAssistant()` returns `{ reply, eventDateIso, eventStart, eventEnd }`.
- **Key pool** (`GEMINI_API_KEYS`, comma-separated): one key per message, round-robin. A second key is only launched if the first is slow (`HEDGE_MS`); the loser is aborted. Keys that return 429/403 get an in-memory cooldown. Keys whose Google project is banned (403 `PERMISSION_DENIED`) are useless — remove them from the env var.
- **`api/_canned.js`** — pre-written replies (greeting, address, payments, "are you a bot", per-category price lists…) with random variants, answered without calling Gemini. Only fires for short, single-intent messages **without digits**; anything else goes to the AI. The closing question follows the same 4-data checklist as the prompt.
- **`api/_offline.js`** — rule-based "brain without AI": parses Spanish dates (`20 de noviembre`, `20/11`, `este sábado`), time ranges (`de 3 a 8` → 15:00–20:00), guests, budget and event type; checks availability against the calendar, returns `eventDateIso/eventStart/eventEnd` so holds still happen, and always pitches the venue. `offlineReply()` always returns a reply; `confident` says whether it understood something concrete.
- **Answer order in `askAssistant()`**: canned → offline (if `confident` and ≤18 words) → Gemini → offline again if Gemini fails. A total Gemini failure opens a 90s circuit breaker (`aiDownUntil`) during which everything is answered offline. `ASSISTANT_MODE` env: `balanced` (default), `ai-first`, or `offline` (never call Gemini). The bot never returns "assistant unavailable".
- **`api/_db.js`** — Firebase **Firestore** via `firebase-admin` (server only) is the **single calendar** (`event_bookings`) for the web chat, WhatsApp and the owner's panel, plus `whatsapp_conversations`. Statuses `confirmado`/`bloqueado_manual` block permanently; any other non-`cancelado` status is a hold that expires `HOLD_HOURS` (72) after `updated_at` (ISO strings). Every customer-side reservation (chat holds, WhatsApp holds, public orders) goes through `reserveBooking()`: a Firestore transaction that reads+writes the per-date lock doc `booking_locks/{date}`, so two clients requesting the same date contend on that doc and the loser retries and sees the clash (a plain query can't detect a concurrently created doc). Queries only use single-field filters (no composite indexes needed). `firestore.rules` denies all client access to these collections; the admin SDK bypasses rules.
- **`api/chat.js`** (web) / **`api/whatsapp.js`** (Twilio) — each conversation owns one hold with a fixed id (`web_<sessionId>` / `wa_<phone>`), which is excluded from its own availability check so the bot never tells a client their own date is taken.
- **`api/bookings.js`** — calendar API for the page. Public GET returns only dates/hours (no names, phones or totals); public POST can only create `solicitud_enviada` and gets 409 on a clash. With header `x-admin-key` = `ADMIN_PASSWORD` the owner's panel reads everything and can update. The panel password lives only in that env var, never in the HTML.
- The assistant is consultative only: it never mutates the order. Adding items stays with the normal buttons.
- Env vars (`.env` locally, Vercel in production): `GEMINI_API_KEYS`, `FIREBASE_SERVICE_ACCOUNT` (service-account JSON, raw or base64; or `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`), `ADMIN_PASSWORD`, `CONTRATO_PROPIETARIO_NOMBRE` / `CONTRATO_PROPIETARIO_DNI` (owner data for the contract, only sent to the authenticated panel), and `TWILIO_AUTH_TOKEN` for WhatsApp.

## Contract (`contrato-local.html`)

Printable template of the venue-rental contract (transcribed from `Contrato 2026.pdf`, which is gitignored because it contains the owner's DNI). The panel's "Generar contrato" button fetches it, replaces the `{{MARKERS}}` with the order data (price = only the `local` category lines; S/300 deposit; balance), and opens it for printing. The owner's name/DNI come from `/api/bookings` (admin only), never from tracked files.

### Legacy client-side Gemini path (do not extend)

`js/chatbot.js`, `js/env-loader.js`, and `config.js` implement an older approach where `window.GEMINI_API_KEY` is exposed **in the browser**. `config.js` is gitignored and holds a real key on this machine. `ENV_SETUP.md` documents this older path and refers to Netlify, which is not where this deploys — treat that doc as stale. Any new AI work should go through `api/chat.js`.

## `_preview_prototipo.html` structure

One IIFE, organized by banner comments — grep for `=== ` to navigate:

- `PROTOTYPE STAGE SWITCHER` — `goStage('internal' | 'client')` toggles `#stage-internal` / `#stage-client`. The file demos **two products at once**: the owner's internal quoting panel and the customer-facing view.
- `PANEL INTERNO` — the owner's flow (`#view-catalog`, `#view-history`), category → item → quantity, running total, fuzzy search.
- `VISTA CLIENTE` — no login; the owner pre-loads the client name and shares a link. Has its own catalog/item views and a WhatsApp bubble.
- `CALENDARIO COMPARTIDO` — `HISTORY` is filled from `/api/bookings` and every change is sent there (`persistNewRecord` / `persistUpdate`); `localStorage` is only an offline cache. Admin login validates the password against the server.
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
