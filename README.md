# Soap Calculator

An offline-first soap recipe scaler for home use.

![Soap Calculator main view](docs/images/main-view-desktop.png)

## What it is

A small browser-based calculator that replaces the spreadsheet workflow for
scaling a soap recipe from one anchor ingredient. It runs as a tiny Node.js
service on a home Ubuntu Server and is reachable from any phone, tablet, or
laptop on the same network. After install it never touches the internet
again — handy for a permanent kitchen-counter appliance.

## Key features

- Anchor-based input: enter the weight of any ingredient (or the total) and
  the rest of the recipe is calculated from it
- Heavy / Light essential oil toggle
- Grams or ounces, switchable on the fly (storage is always in grams)
- Save and load named recipes, with optional notes
- Measuring mode — locks the inputs and shows tappable checkboxes for working
  through a recipe at the counter
- Printable recipe sheets with a Measured-checkbox column for ticking off
  ingredients in pen as you weigh them
- 100% offline after install — no internet connection ever required
- Accessible from any device on your home network, no app to install

## Quick start

See [docs/INSTALL.md](docs/INSTALL.md) for the full install guide. Once it's
running you'll visit `http://<your-server-ip>:8030` from any device on the
network to use it.

## Documentation

- [Install guide](docs/INSTALL.md) — step-by-step setup on a fresh Ubuntu Server
- User guide (coming soon)
- Troubleshooting (coming soon)

## Specification

For the full technical detail — calculation model, data shape, HTTP surface,
deployment layout — see [SPEC.md](SPEC.md).

## License

License: not yet specified.
