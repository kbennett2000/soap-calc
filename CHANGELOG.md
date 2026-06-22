# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-22

First stable release. A complete, offline-first replacement for the Google Sheets
soap-recipe workflow.

### Added

- **Anchor-based scaling** — enter the weight of any single ingredient (or the
  batch total) and the entire recipe is recalculated from it.
- **Heavy / Light essential-oil toggle** — exactly one factor active at a time.
- **Grams ↔ ounces** display toggle; all weights are stored internally in grams
  at full precision and rounded to 2 decimals only for display.
- **Saved recipes** — create, name, load, and annotate recipes with notes.
- **Soap Log** — track every batch you make, see at a glance what's curing vs.
  ready to use, and search past batches by name, ingredient, or notes.
- **Measuring mode** — locks the inputs and shows tappable checkboxes for working
  through a recipe at the counter.
- **Printable recipe sheets** with a Measured-checkbox column.
- **100% offline operation** — no external network requests from server or
  frontend, ever. No CDNs, fonts, analytics, or update checks.
- **Zero dependencies, no build step** — a single `server.js` (built-in Node
  modules only) and a single `index.html`; persistence is one JSON file on disk
  with atomic writes.
- **systemd deployment** artifacts for Ubuntu Server, plus install, user, and
  troubleshooting guides.

[1.0.0]: https://github.com/kbennett2000/soap-calc/releases/tag/v1.0.0
