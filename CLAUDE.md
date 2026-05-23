# CLAUDE.md

Guidance for Claude Code when working in this repo. Read this first, every session.

## Project Overview

A browser-based soap recipe calculator that replaces a Google Sheets workbook. Runs on a home Ubuntu Server, served over LAN to PCs, tablets, and phones. **Must operate 100% offline after install — no internet connection, ever, for any reason.**

Full specification: see `SPEC.md` at the repo root. Read it before making non-trivial changes.

## Tech Stack

- **Runtime:** Node.js v20 or v22 LTS
- **Server deps:** built-in Node modules only (`http`, `fs`, `path`, `url`). No `npm install`, no `package.json` dependencies, no lockfile.
- **Frontend:** vanilla HTML5 + CSS3 + ES2020 JavaScript. No frameworks, no bundler, no build step.
- **Persistence:** single JSON file on disk
- **Process management:** systemd
- **Target OS:** Ubuntu Server LTS

## Architecture

Repo layout:

- `server.js` — the entire backend, one file, built-in modules only
- `index.html` — the entire frontend (HTML + inline `<style>` + inline `<script>`) in one file
- `SPEC.md` — full specification
- `README.md` — install and usage
- `data.json.example` — default data file (factors + empty recipes), copied to `/var/lib/soapcalc/data.json` on install
- `deploy/soapcalc.service` — systemd unit
- `deploy/soapcalc.conf.example` — example runtime config, copied to `/etc/soapcalc.conf`

HTTP surface (keep minimal):

- `GET /` → serves `index.html`
- `GET /api/data` → returns the full data JSON
- `PUT /api/data` → atomic full-file replace
- `GET /health` → `{"status":"ok"}`

State flow: frontend GETs the data blob on load → mutates in memory → PUTs the whole blob back on any persisted change. No partial updates, no per-field endpoints.

## Conventions

**Hard rules (do not violate):**

- No external network requests from server or frontend, ever — no CDNs, no fonts, no analytics, no update checks, no telemetry.
- No npm packages. If you think you need one, stop and ask the user first.
- All weights stored internally in **grams**. Unit conversion (g ↔ oz) is display-only.
- All disk writes are atomic: write to `<file>.tmp`, then `rename()`.
- All displayed weights rounded to **2 decimal places**; stored values keep full precision.
- Lard factor is locked at `1.0`. Do not expose it as editable in the settings UI.
- Essential oil has two factors (Heavy / Light). Exactly one is active at a time, selected by a UI toggle.

**Code style:**

- JSON keys: `snake_case` (matches `SPEC.md` data model)
- JS variables and functions: `camelCase`
- CSS classes and HTML IDs: `kebab-case`
- Use semicolons in JS
- 2-space indentation everywhere
- No trailing whitespace; files end with a single newline

**Project layout:**

- Keep `server.js` flat and readable; do not over-abstract a ~200-line server.
- `index.html` stays as one file. Resist splitting into separate `app.js` / `styles.css` — the single-file constraint is intentional for deploy simplicity and offline guarantees.
- New deploy artifacts go in `deploy/`.
- New docs go at the repo root as `<TOPIC>.md` (e.g., `INSTALL.md`).

**Logging:**

- Log to stdout / stderr only (systemd captures to journal). No log files.
- Log: server start with port, PUT timestamps, errors.
- **Never** log request bodies — recipe notes are personal data.

## Out of Scope for v1

Do not build any of these unless the user explicitly asks. Where noted, reserve names/fields for forward compatibility.

- Multiple named factor sets — but **reserve a `factor_set_id` field on recipes**, default to `"default"`
- Authentication or user accounts
- HTTPS (LAN-only; can be added via reverse proxy later)
- Recipe import / export (users copy `data.json` for now)
- Ingredient cost tracking
- Lye calculator integration (SAP values, superfat percentages)
- PWA manifest / "add to home screen" / mobile app wrapper
- Multi-language support
- Database of any kind (SQLite, etc.) — the JSON file is the persistence layer



## Git Workflow

After any code change is complete and verified (tests pass / lint clean /
feature works), do the following without being asked:

1. `git add -A` to stage all changes
2. Commit with a concise conventional-commit message
   (e.g. `feat: add user auth middleware`, `fix: handle empty cart edge case`,
   `refactor: extract validation into shared module`, `docs: update README`)
3. `git push` to push to origin/main

Commit at logical checkpoints — a complete feature, a bug fix, a refactor —
not after every individual file edit. If a task spans multiple commits,
make each commit independently meaningful and atomic.

If `git push` fails (auth, conflict, network), surface the full error to the
user immediately. Do not retry silently or attempt destructive resolutions
(no `--force`, no resetting branches).

Never commit secrets, API keys, .env files, or anything matching .gitignore.



## Engineering Principles

### Tests are required, not optional
- Every new feature, bug fix, or non-trivial change ships with tests.
- For new functionality, prefer test-first: write the test from the spec,
  then implement until it passes.
- A task is not "done" until the relevant tests pass. Do not report completion
  with failing or skipped tests.
- When fixing a bug, first write a test that reproduces the bug (and fails),
  then fix it. This prevents regressions.
- Keep the test suite fast. If a test is slow, isolate it (mark as integration
  or e2e) so the default `test` command stays under 10 seconds for unit tests.

### Tight feedback loops
- Use strict typing everywhere (TypeScript strict mode / Pydantic / Zod —
  whatever the stack supports). Type errors should surface immediately.
- Run lint and typecheck before declaring a task complete.
- Add structured logging at module boundaries from day one. When something
  breaks, logs should narrow the cause in seconds, not minutes.
- If a change requires manual verification (UI, integrations), state exactly
  what to check and how — don't leave it implicit.

### Spec before code for non-trivial work
- For any task touching 3+ files, introducing a new module, or changing a
  contract between components: produce a spec FIRST in plan mode. Do not
  start editing until the user has approved the plan.
- For significant architectural decisions, write a short ADR (Architecture
  Decision Record) in `/docs/adr/` capturing: context, options considered,
  decision, consequences. Reference the ADR in commit messages.
- Read `/docs/` and `/specs/` (if they exist) before starting work. Those
  files describe intent; the code describes implementation. Both matter.

### Taste and restraint
- Prefer the simplest solution that solves the problem. Resist adding
  abstraction, config options, or framework features that aren't justified
  by an actual requirement.
- If a diff is getting large, stop and ask whether the task should be
  decomposed into smaller commits.
- Reuse existing patterns in the codebase before inventing new ones.
