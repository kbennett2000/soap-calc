# Soap Calculator — Project Specification

A small browser-based calculator that replaces a Google Sheets soap-making recipe scaler. Runs on a home Ubuntu Server, served over LAN to PCs, tablets, and phones. Must operate 100% offline after installation — no internet connection ever, for any reason.

---

## 1. Overview

The existing spreadsheet scales a soap recipe based on the weight of one anchor ingredient (currently lard). All other ingredients are computed as fixed ratios of that anchor. This app replicates that workflow, generalizes it so any ingredient can be the anchor, and adds saved recipes, a print view, unit switching, and a settings page for adjusting the ratios.

The application has two parts:

- **A single self-contained HTML file** containing the entire UI and all calculation logic (runs client-side in the browser)
- **A minimal Node.js server** that serves the HTML file and provides read/write access to a single JSON data file for persistence

There is no database, no build step, no external runtime dependencies beyond Node.js itself, and no npm packages — only Node's built-in modules (`http`, `fs`, `path`, `url`).

---

## 2. Calculation Model

### 2.1 Base ratios

Every ingredient has a **factor** — a dimensionless number expressing its weight relative to lard. Lard's factor is fixed at `1.0`. Default factors (from the source spreadsheet):

| Ingredient      | Factor              |
|-----------------|---------------------|
| Lard            | 1.00000000000000000 |
| Coconut Oil     | 0.25121951220000000 |
| Lye             | 0.17317073170000000 |
| Water           | 0.47560975610000000 |
| Essential Oil (Heavy) | 0.06097560975609760 |
| Essential Oil (Light) | 0.03658536585000000 |

Essential oils have two possible factors. Exactly one is active at any time, selected by a **Heavy / Light** toggle.

### 2.2 Anchor-based input

The user can type a weight into **any** ingredient field, including a "Total" row. That field becomes the **anchor**. All other fields recompute from it.

The internal math always normalizes through lard:

```
implied_lard_weight = anchor_weight / anchor_factor
ingredient_y_weight = implied_lard_weight × ingredient_y_factor
```

For the **Total** field, the factor is the sum of all active factors (lard + coconut + lye + water + active_eo_factor):

```
implied_lard_weight = total_weight / sum_of_active_factors
```

### 2.3 Anchor UX

- The most recently edited field is the anchor
- The anchor field is visually distinguished (e.g., highlighted border, anchor icon)
- All non-anchor fields display computed values and update in real time as the user types
- Clicking/tapping into a different field and typing makes that field the new anchor
- Toggling Heavy/Light while essential oil is the anchor will rescale the entire batch (mathematically correct — flag this with a brief visual cue, e.g., other fields briefly flash)

### 2.4 Precision

- All calculations performed in IEEE 754 double precision (JavaScript `Number`)
- Internal storage of weights is always in **grams** regardless of display unit
- Displayed weights rounded to **2 decimal places**
- Factor values stored at full input precision (up to 17 significant digits)

---

## 3. Functional Requirements

### 3.1 Main calculator view

The primary screen. Contains:

- A row per ingredient (Lard, Coconut Oil, Lye, Water, Essential Oil) plus a Total row
- Each row shows: ingredient name, factor (read-only display), weight input field, unit suffix (g or oz)
- A Heavy / Light toggle for essential oil
- A unit toggle (g / oz)
- A row of preset buttons matching the source spreadsheet's six columns: 205g, 410g, 615g, 820g, 1025g, 1230g of lard (these set lard as the anchor and fill in the value)
- Buttons: **Save Recipe**, **Load Recipe**, **Print**, **Settings**
- Large, readable typography — designed to be readable on a phone propped on a workbench, possibly with soapy hands

### 3.1.1 Measuring mode

A toggle-on mode for working through a finalized recipe at the counter. Reached
via a "Start measuring" button on the main calculator view, near the unit toggle.

**While active:**

- All weight input fields become read-only
- A checkbox column appears at the left of each ingredient row
- Tapping a checkbox toggles a strikethrough on the ingredient name and weight
  (rows remain legible — strikethrough only, no dimming)
- The preset buttons and the anchor indicator are hidden (not relevant while
  measuring)
- The "Start measuring" button is replaced with "Done"
- The g/oz unit toggle remains available and does NOT clear checkboxes (the
  recipe is unchanged, only the display)
- A "Reset" button is visible, clears all checkboxes without exiting the mode

**Exiting the mode** (via "Done") clears all checkboxes.

**Auto-clear:** checkboxes are cleared if any of the following occur (these
shouldn't be reachable while inputs are locked, but the rules are defensive):

- Any weight input changes
- The anchor field changes
- The Heavy/Light toggle changes
- The active factor set changes (e.g., from another device editing settings)

**Persistence:** checkbox state is in-memory only. A page refresh clears it.
This is intentional — a measuring session is short (10–30 minutes) and
cross-device persistence isn't worth the complexity.

### 3.2 Settings page

Reachable from the main view, returns to it on save/cancel. Contains:

- Editable factor for each ingredient **except lard** (lard is locked at 1.0 as the canonical base)
- Both Heavy and Light essential oil factors editable
- Default unit (g / oz)
- Default Heavy/Light selection
- **Reset to defaults** button (restores the values listed in §2.1)
- **Save** and **Cancel** buttons

Factor changes persist via the server's JSON data file and take effect immediately for all connected devices.

### 3.3 Saved recipes

A recipe is a saved batch — anchor field, anchor weight (stored in grams), Heavy/Light selection, optional notes, and a timestamp.

> **Note:** v1 supports a single global factor set. To allow future expansion to multiple named factor sets without breaking saved recipes, the recipe data model should include a `factor_set_id` field (defaulting to `"default"` in v1).

Operations:
- **Save:** prompt for a name, persist current state
- **Load:** browse saved recipes by name and date, load restores the anchor field, weight, Heavy/Light, and notes
- **Delete:** remove a saved recipe (with confirmation)
- **Rename:** change the name of a saved recipe

### 3.4 Print view

A printer-friendly layout (use `@media print` CSS). Contains:

- Recipe name (large, top of page)
- Date printed
- Ingredients table with columns: **Ingredient | Factor | Weight | ☐ Measured**
- The "Measured" column is a checkbox for marking off ingredients as they're weighed out
- Heavy/Light selection indicator
- Notes/observations section (multiline area, blank or pre-filled from the saved recipe)
- Hidden when printing: navigation buttons, settings, anchor highlighting

### 3.5 Unit handling

- Global g / oz toggle in the main view
- All weights stored internally in grams; conversion is display-only
- Conversion factor: `1 oz = 28.3495231 g`
- Input fields interpret typed values in the currently selected unit
- Switching units does not change the actual recipe — only the displayed numbers
- Saved recipes always store grams internally, so unit changes don't affect them

### 3.6 Input validation

- Reject negative numbers
- Reject zero (would divide by zero when used as anchor)
- Reject non-numeric input
- Empty all fields → no calculation displayed, no anchor set
- All factors in settings must be positive numbers > 0

---

## 4. Non-functional Requirements

### 4.1 Offline guarantee (the hard requirement)

The application must function with **zero internet access**, forever, after initial installation. This means:

- No `<link>` or `<script>` tags referencing external URLs (no CDNs, no Google Fonts, no analytics)
- No external image assets — use SVG inline or omit
- No telemetry, no update checks, no "phone home" of any kind
- All fonts are system fonts (`-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`)
- The server makes no outbound network connections of any kind
- The installation can and should be performed on an air-gapped machine (e.g., via USB transfer)

### 4.2 Responsive design

- Single layout that adapts from phone (~375px wide) to desktop
- Touch-friendly tap targets (minimum 44×44 px) for mobile/tablet
- Readable at arm's length on a phone
- No horizontal scrolling at any supported width

### 4.3 Browser support

- Latest two versions of: Chrome, Firefox, Safari, Edge
- iOS Safari and Android Chrome on tablets and phones
- No IE, no legacy browsers

### 4.4 Performance

- Page load (over LAN) under 200ms
- Calculation updates feel instantaneous (no perceptible delay on input)
- Server cold start under 1 second

---

## 5. Technical Specification

### 5.1 Stack

- **Server:** Node.js (LTS, v20 or v22), built-in modules only
- **Frontend:** Plain HTML5, CSS3, vanilla JavaScript — no frameworks, no build step
- **Persistence:** Single JSON file on disk

### 5.2 File layout

```
/opt/soapcalc/
  ├── server.js          # The Node.js server
  ├── index.html         # The entire frontend (HTML + CSS + JS inline)
  └── README.md          # Install and usage notes

/etc/soapcalc.conf       # Configuration (PORT, etc.)

/var/lib/soapcalc/
  └── data.json          # Factors, settings, saved recipes

/etc/systemd/system/
  └── soapcalc.service   # systemd unit
```

### 5.3 Data file shape (`/var/lib/soapcalc/data.json`)

```json
{
  "schema_version": 1,
  "factor_sets": {
    "default": {
      "lard": 1.0,
      "coconut_oil": 0.2512195122,
      "lye": 0.1731707317,
      "water": 0.4756097561,
      "essential_oil_heavy": 0.060975609756097600,
      "essential_oil_light": 0.036585365850
    }
  },
  "settings": {
    "default_unit": "g",
    "default_eo_type": "heavy"
  },
  "recipes": [
    {
      "id": "uuid-or-timestamp-string",
      "name": "Standard 2x batch",
      "factor_set_id": "default",
      "anchor_field": "lard",
      "anchor_value_g": 410.0,
      "eo_type": "heavy",
      "notes": "",
      "created_at": "2026-05-22T12:00:00Z"
    }
  ]
}
```

### 5.4 HTTP endpoints

Keep this surface minimal — it's a single-user-ish LAN app:

| Method | Path             | Description                                          |
|--------|------------------|------------------------------------------------------|
| GET    | `/`              | Serves `index.html`                                  |
| GET    | `/api/data`      | Returns the full `data.json` contents                |
| PUT    | `/api/data`      | Replaces the full `data.json` (atomic write)         |
| GET    | `/health`        | Returns `200 OK` with `{"status":"ok"}` for systemd  |

The frontend reads the full data blob on load, modifies it in memory, and PUTs it back on any persisted change (saving a recipe, editing factors, etc.). This is simple and safe for a home LAN with one or two concurrent users.

Atomic write pattern: write to `data.json.tmp`, then `rename()` to `data.json`. Prevents corruption if the server is killed mid-write.

### 5.5 Configuration

`/etc/soapcalc.conf` is a simple `KEY=VALUE` file:

```
PORT=8030
DATA_FILE=/var/lib/soapcalc/data.json
BIND_ADDRESS=0.0.0.0
```

- `PORT` — TCP port to listen on (default 8030)
- `DATA_FILE` — path to the JSON data file (default `/var/lib/soapcalc/data.json`)
- `BIND_ADDRESS` — interface to bind (default `0.0.0.0` for all interfaces; set to a specific LAN IP to restrict)

Environment variables of the same names override file values, in case that's easier for testing.

### 5.6 Logging

- Log to stdout/stderr (systemd captures to journal)
- Log: server start with port, each PUT to `/api/data` (timestamp only, not contents), errors
- Do **not** log full request bodies (the data file may contain personal recipe notes)

---

## 6. Deployment

### 6.1 Prerequisites

- Ubuntu Server (any currently supported LTS)
- Node.js v20 or v22 installed (offline-installable via the official `.deb` packages or NodeSource tarball copied to the machine)
- A dedicated system user `soapcalc` (no shell, no login)

### 6.2 Install steps

The README.md in the repo should document this. The shape:

1. Copy `/opt/soapcalc/` directory into place
2. Create system user: `useradd --system --no-create-home --shell /usr/sbin/nologin soapcalc`
3. Create `/var/lib/soapcalc/`, chown to `soapcalc:soapcalc`, mode `750`
4. Copy `/etc/soapcalc.conf` (with desired port), mode `644`
5. Copy `/etc/systemd/system/soapcalc.service`
6. `systemctl daemon-reload && systemctl enable --now soapcalc`
7. Open the port on the LAN-facing interface only (ufw rule restricted to LAN subnet)
8. Verify via `curl http://localhost:8030/health`

### 6.3 systemd unit

The unit should:

- Run as user `soapcalc`, group `soapcalc`
- `Restart=always`, `RestartSec=5`
- `EnvironmentFile=/etc/soapcalc.conf`
- `ExecStart=/usr/bin/node /opt/soapcalc/server.js`
- `ReadWritePaths=/var/lib/soapcalc`
- `ProtectSystem=strict`, `ProtectHome=true`, `PrivateTmp=true`, `NoNewPrivileges=true`
- `RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX`
- After `network.target`

### 6.4 First-run behavior

If `data.json` does not exist when the server starts, create it with the default factor set listed in §2.1, empty recipes list, and default settings. Log "initialized new data file" once.

### 6.5 Backup

The README should mention: the entire app state is in `/var/lib/soapcalc/data.json`. To back up: copy that file. To restore: replace that file and restart the service.

---

## 7. Out of Scope for v1

These are explicitly **not** in scope, but the architecture should not preclude them:

- Multiple named factor sets (the `factor_set_id` field is reserved for this)
- User accounts / authentication (LAN-only, single household)
- HTTPS (LAN-only; can be added via reverse proxy later if desired)
- Recipe import/export beyond copying the JSON file
- Ingredient cost tracking
- Lye calculator integration (SAP values, superfat percentages)
- Mobile app wrapper (PWA manifest could be added later for "add to home screen")
- Multi-language support

---

## 8. Open questions for the developer

These are minor and can be decided during implementation:

1. **Recipe ID format** — UUID v4, or timestamp-based string? Either is fine; pick one and be consistent.
2. **Anchor icon vs. highlight** — concrete visual treatment for the anchor field is a UI judgment call. Whatever reads cleanly on both desktop and mobile.
3. **Preset buttons styling** — six buttons in a row, or a dropdown? Row probably reads better.
4. **"Total" row position** — top of the table or bottom? The source sheet has it at the bottom; I'd keep it there for familiarity.

---

## 9. Acceptance criteria

The build is complete when:

- [ ] Measuring mode locks inputs, shows checkboxes, strikethrough toggles per row, exits on Done, auto-clears on recipe change
- [ ] Typing a weight into any ingredient field instantly updates all other ingredients
- [ ] Total row works as an anchor
- [ ] Heavy/Light toggle correctly switches the EO factor and recomputes
- [ ] g/oz toggle correctly converts displayed values without changing stored values
- [ ] All six preset buttons match the original spreadsheet's column totals exactly
- [ ] Recipes can be saved, loaded, renamed, and deleted
- [ ] Settings page edits factors, persists across server restart, takes effect on all connected devices
- [ ] Print view renders cleanly on letter and A4, includes the measured checkbox column and notes section
- [ ] Application functions with network cable physically unplugged
- [ ] No external resources are referenced anywhere in the HTML
- [ ] systemd service starts on boot and survives `kill -9` of the node process
- [ ] Port is configurable via `/etc/soapcalc.conf` without code changes
- [ ] Works on iPhone Safari, Android Chrome, desktop Firefox, desktop Chrome
- [ ] Tab strip on the main view switches between Calculator and Batches
- [ ] Tab selection persists across page refresh via URL hash
- [ ] Starting a batch from a calculated recipe snapshots its ingredients and amounts and creates a new batch
- [ ] Blank batch creation works, including with zero ingredients
- [ ] Existing batches can be edited (name, notes, cure-time override only); other fields are read-only in UI and rejected by server
- [ ] Maturity status correctly transitions through curing → ready → mature based on date_made + cure_time
- [ ] The "ready" status applies within 14 days of cure completion; after that, status is "mature"
- [ ] Dashboard view shows progress bars and status badges correctly for all three statuses
- [ ] Table view shows correct columns, sortable
- [ ] View toggle persists per-device in localStorage
- [ ] Search matches against name, ingredients, and notes simultaneously
- [ ] Date range, status, and ingredient filters work individually and in combination
- [ ] Default cure time editable in settings, takes effect for batches without override
- [ ] Existing data.json files without `batches` or `default_cure_time_days` are migrated on first load
- [ ] Cross-tab refresh propagates batch additions/changes on focus
- [ ] Phone-width layout (375px) usable for all batch interactions
- [ ] Deleting a recipe does not delete batches that reference it; batches show a "(recipe no longer exists)" indicator gracefully

---

## 10. Soap Log (Batches)

### 10.1 Overview

The Soap Log tracks batches of soap that have actually been made. Where
recipes are reusable templates (ratios and ingredient lists), batches are
historical events with a specific date, name, and snapshot of what went
into them.

Batches are added through three flows: from a calculated recipe (the
common case), from a blank form (for historical entries or off-recipe
batches), and by editing certain fields on an existing batch (notes,
name, cure-time override).

The Soap Log lives on a new "Batches" tab in the main view, alongside the
existing calculator. The two are sibling views of the same application.

### 10.2 Data model

A batch is stored as an object with these fields:

```json
{
  "id": "batch_1716508800000",
  "name": "Lavender Spring 2026",
  "date_made": "2026-04-15",
  "ingredients": [
    { "name": "Lard", "weight_g": 820 },
    { "name": "Coconut Oil", "weight_g": 206 },
    { "name": "Lye", "weight_g": 142 },
    { "name": "Water", "weight_g": 390 },
    { "name": "Essential Oil", "weight_g": 50 }
  ],
  "cure_time_days_override": null,
  "notes": "Followed standard recipe. Used Bulgarian lavender EO.",
  "source_recipe_id": "recipe_1715000000000",
  "created_at": "2026-04-15T14:32:00Z"
}
```

Field details:

- `id` — generated at creation, never changes. Same timestamp-based
  pattern as recipes.
- `name` — required, trimmed, may contain any characters. Duplicates
  allowed.
- `date_made` — required, ISO 8601 date (no time component). Used for
  maturity calculations. Defaults to today's date when creating from
  recipe. May be backdated for historical entries.
- `ingredients` — array, may be empty (for historical batches where
  ingredients are unknown). Each entry has a freeform `name` string and
  `weight_g` (always in grams; null permitted for historical entries
  where weight isn't known).
- `cure_time_days_override` — null to use the global default, or an
  integer number of days for this specific batch.
- `notes` — string, may be empty. Multiline.
- `source_recipe_id` — id of the recipe used at batch creation, or null
  for blank/historical batches. Recipe deletion does not cascade to
  batches — `source_recipe_id` may reference a deleted recipe; this is
  acceptable and the UI just shows "(recipe no longer exists)" where it
  would otherwise link.
- `created_at` — ISO 8601 timestamp of when the batch was added to the
  log. Distinct from `date_made`: a historical batch made in January
  might be entered in May, giving `date_made: 2026-01-15` and
  `created_at: 2026-05-23T...`.

#### Settings additions

A new setting in `settings`:

- `default_cure_time_days` — integer, default `35` (5 weeks). Editable in
  the settings page.

#### Data file shape changes

Add a top-level `batches` array to `data.json`. Existing data files
without the field should be migrated on first load by the server: if
`batches` is missing, write it as `[]`. Same migration for the new
settings field — if `default_cure_time_days` is missing, set it to 35.

#### Immutability rules

Once a batch is created, the following fields are **read-only** in the UI
and reject any PUT attempting to change them:

- `id`
- `date_made`
- `ingredients`
- `source_recipe_id`
- `created_at`

The following fields **remain editable**:

- `name`
- `notes`
- `cure_time_days_override`

The server-side PUT handler should validate this on incoming requests:
if any of the immutable fields differ from the stored value for an
existing batch, reject with 400.

### 10.3 Maturity calculation

For a batch, the cure time used is `cure_time_days_override` if set,
otherwise `settings.default_cure_time_days`.

Maturity is calculated against the current date (the user's browser
local date, not the server):

- `days_elapsed = today - date_made` (in whole days, floor)
- `progress = days_elapsed / cure_time_days` (clamped to 0.0–1.0)
- `status` is one of:
  - `curing` — `0 <= progress < 1.0`
  - `ready` — `progress >= 1.0` and the batch is within 14 days past its
    ready date (a "freshly ready" window for visibility)
  - `mature` — `progress >= 1.0` and 14+ days past ready date

The 14-day "ready" window is a UI convenience — it gives recently-ready
batches a distinct status so they stand out. After two weeks of being
ready, they become "mature" and recede visually but remain accessible.

A batch with `date_made` in the future (rare, but legal — e.g. you're
planning ahead) shows `days_elapsed` as negative; status is `curing` and
progress is shown as 0%.

### 10.4 UI: Batches tab

The main view gains a tab strip near the top with two tabs: **Calculator**
and **Batches**. The active tab is preserved across page refreshes via
the URL hash (`#calculator` or `#batches`); default is `#calculator` for
backward compatibility.

Switching tabs does not affect the other tab's state. If you're mid-edit
on the calculator and click Batches, the calculator state is preserved
when you switch back.

#### 10.4.1 Batches list

The default view of the Batches tab. Top to bottom:

1. **Search bar** — single text input, placeholder "Search batches by
   name, ingredient, or notes." Searches across all three fields
   simultaneously, case-insensitive, substring match.

2. **Filters** — collapsible section ("▸ Filters" / "▾ Filters") with:
   - Date range (from / to date pickers; either may be omitted)
   - Status filter (multi-select: curing, ready, mature)
   - Ingredient filter (text input, substring match against any
     ingredient name in the batch)
   - "Clear filters" button (visible only when any filter is active)

3. **View toggle** — two buttons: **Table** and **Dashboard**. Last
   selection persists across sessions in localStorage. Default is
   Dashboard for new users.

4. **New batch** button — opens the blank batch creation form (see
   §10.5).

5. **The list itself** — table or dashboard depending on toggle.

#### 10.4.2 Dashboard view

A card or row per batch, sorted by `date_made` descending (most recent
first). Each card shows:

- Batch name (large)
- Date made (small, formatted readably: "April 15, 2026")
- A horizontal progress bar showing cure progress 0–100%
- Status badge: "Curing • 18 days" / "Ready! • 2 days ago" / "Mature"
- A small ingredient summary ("5 ingredients, 1608 g total") or "(no
  ingredients recorded)" for historical batches with empty ingredients
- Notes preview (first ~80 chars, with "…" if truncated)
- Clicking the card opens the batch detail view

Progress bar styling: the bar fills with a color that signals status —
curing batches use a neutral blue, ready batches use green, mature
batches use a softer gray-green (they're still ready, just less
attention-grabbing).

#### 10.4.3 Table view

A traditional table sorted by `date_made` descending by default, with
column headers that toggle sort:

| Name | Date made | Days curing | Status | Ingredients | Notes |

Each column is left-aligned text except Days curing (right-aligned
number). "Notes" is a truncated preview. Clicking a row opens the batch
detail view.

Column sort: clicking a header sorts by that column; clicking the active
sort header reverses direction. Active sort indicated by a small arrow.

#### 10.4.4 Empty states

- No batches at all: large friendly empty state with a "Add your first
  batch" call-to-action button.
- No batches match current filters: smaller message ("No batches match
  your filters") with a "Clear filters" link.

### 10.5 UI: Batch creation flows

#### 10.5.1 From recipe (the common case)

Added to the calculator view as a new button **Start a batch** in the
recipe-actions row, alongside Save / Load / Print. Disabled when no
calculation is currently displayed (same rule as Save Recipe).

Clicking opens a modal:

- Name (required, defaults to a placeholder using the recipe name or
  "Batch made [date]" if no recipe loaded)
- Date made (required, defaults to today, editable date picker)
- Notes (optional, multiline)
- A read-only summary of the ingredients and amounts that will be
  snapshotted, with active EO type indicated
- An expandable "Advanced" section containing:
  - "Override cure time" checkbox; when checked, reveals a number input
    for cure_time_days (defaulting to the current setting value)
- "Start batch" (primary) and "Cancel" buttons

On Start batch: creates the batch object with snapshotted ingredients,
PUTs to `/api/data`, closes the modal, shows a "Batch started" toast.
Does NOT navigate to the Batches tab — the user is likely on a roll.
Does include a "View in Batches" link in the toast.

#### 10.5.2 Blank/historical batch

The "New batch" button on the Batches list opens a modal:

- Name (required, no default)
- Date made (required, defaults to today, editable)
- Ingredients section:
  - Initially empty
  - "+ Add ingredient" button adds a row with two inputs: name and
    weight (in grams)
  - Each ingredient row has a remove button (×)
  - Weight may be left blank for historical entries
- Notes (optional, multiline)
- "Override cure time" same as the from-recipe flow
- "Save batch" (primary) and "Cancel"

On Save: same PUT pattern, closes modal, batch appears in the list.

#### 10.5.3 Edit existing batch

Clicking a batch in the list opens a detail view (full-screen modal on
phone, large modal on desktop). The detail view shows:

- Header: batch name (editable inline), date made (read-only), status
  badge and progress bar
- Ingredients section (read-only — shown as a table)
- Notes section (editable multiline textarea, with autosave on blur)
- Cure time override (read-only display + an "Edit" button that reveals
  the same override control as in creation)
- "Delete batch" button at the bottom, requires confirmation

Edit semantics:

- Name edits commit on blur or Enter
- Notes commit on blur (autosave)
- Cure time override commits when its modal closes
- Each commit is its own PUT (small, isolated changes — same data blob
  round-trip pattern as elsewhere)

### 10.6 Search and filter behavior

The search and filter controls in §10.4.1 work as follows:

- **Search box** matches against batch name, ingredient names, and notes
  simultaneously. Case-insensitive substring. Empty search shows all
  batches (subject to filters).
- **Date range** filters batches by `date_made`. Inclusive on both ends.
  Either bound may be omitted (open-ended).
- **Status filter** is multi-select; selecting nothing or all is
  equivalent to no filter. Filter applies to the *current* status of
  each batch.
- **Ingredient filter** matches if any of the batch's `ingredients[].name`
  contains the filter text (case-insensitive substring).
- All active filters combine with AND. The search box ORs across the
  three fields it searches; that OR result is then ANDed with filter
  results.

Search and filtering happen client-side. With anticipated batch volumes
(a few hundred over years), this is trivial.

### 10.7 Settings page additions

The settings page (§3.2) gains:

- **Default cure time (days)** — integer input, default 35, must be > 0
- A help-text line below the input: "Most soap cures in 4–6 weeks
  (28–42 days). Individual batches can override this."

### 10.8 Print view changes

Print view (§3.4) is unchanged in this addition. Printing a *batch* is
out of scope for this revision — only recipes are printed. (Future
revision could add batch printouts for record-keeping.)

### 10.9 Interaction with existing features

- **Measuring mode** is unaffected; it operates only on the calculator
  tab.
- **Saved recipes** remain independent. Recipe deletion does not affect
  existing batches that reference the recipe; `source_recipe_id`
  becomes a dangling reference handled gracefully by the UI.
- **Cross-tab refresh** (visibilitychange) extends to the batches array:
  if another device adds a batch, the current tab picks it up on focus
  the same way it picks up factor changes.
- **Heavy/Light selection** is recorded implicitly: the batch's
  ingredient list snapshots the EO weight at creation, so the Heavy/Light
  setting doesn't need to be stored separately.

### 10.10 Out of scope for this revision

These are recognized as potentially valuable but explicitly deferred:

- Batch photos
- Batch ratings (1–5 stars or similar)
- "Repeat this batch" (clone into calculator pre-filled)
- Exporting batches to CSV/PDF
- Statistics/analytics across batches
- Reminders or notifications when a batch is ready
- Printing batch detail sheets
- A master ingredient list with auto-complete and normalization
- Per-recipe cure time (only per-batch override exists)
- Bulk operations (delete multiple, edit multiple)
