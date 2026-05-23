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
