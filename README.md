# Soap Calculator

![Node.js](https://img.shields.io/badge/Node.js-20%20%7C%2022%20LTS-339933?logo=node.js&logoColor=white)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![Offline](https://img.shields.io/badge/offline-100%25-blue)
![Build](https://img.shields.io/badge/build-none-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)

A self-hosted, offline-first soap recipe scaler for cold-process soapmaking at home.

![Soap Calculator main view](docs/images/main-view-desktop.png)

## What it is

A small browser-based calculator that replaces the spreadsheet workflow for
scaling a soap recipe from one anchor ingredient. It runs as a tiny Node.js
service on a home Ubuntu Server (or any homelab box) and is reachable from any
phone, tablet, or laptop on the same network. After install it never touches
the internet again — handy for a permanent kitchen-counter appliance.

## Key features

- Anchor-based input: enter the weight of any ingredient (or the total) and
  the rest of the recipe is calculated from it
- Heavy / Light essential oil toggle
- Grams or ounces, switchable on the fly (storage is always in grams)
- Save and load named recipes, with optional notes
- Soap log: track every batch you make, see at a glance what's curing vs.
  ready to use, and search past batches by name, ingredient, or notes
- Measuring mode — locks the inputs and shows tappable checkboxes for working
  through a recipe at the counter
- Printable recipe sheets with a Measured-checkbox column for ticking off
  ingredients in pen as you weigh them
- 100% offline after install — no internet connection ever required
- Accessible from any device on your home network, no app to install

![Batches tab — track every batch and watch it cure](docs/images/batches-dashboard-desktop.png)

## Quick start

See [docs/INSTALL.md](docs/INSTALL.md) for the full install guide. Once it's
running you'll visit `http://<your-server-ip>:8030` from any device on the
network to use it.

## Documentation

- [Install guide](docs/INSTALL.md) — step-by-step setup on a fresh Ubuntu Server
- [User guide](docs/USER_GUIDE.md) — features and day-to-day workflows
- [Troubleshooting](docs/TROUBLESHOOTING.md) — common problems and fixes

## Specification

For the full technical detail — calculation model, data shape, HTTP surface,
deployment layout — see [SPEC.md](SPEC.md).

## License

MIT — see [LICENSE](LICENSE).
