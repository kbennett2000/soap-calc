# soap-calc

Offline-first soap recipe calculator for home LAN deployment.

A small browser-based calculator that replaces a spreadsheet workflow for
scaling a soap recipe from one anchor ingredient. Runs on an Ubuntu Server
on the home LAN and is reachable from any browser on the network. Operates
100% offline after install — no internet access required, ever.

See [SPEC.md](SPEC.md) for the full specification.

## Status

This is an early-stage build. The server, persistence, config, and a
placeholder front page are in place; the calculator UI itself is not yet
implemented.

## Requirements

- Ubuntu Server (any currently supported LTS)
- Node.js v20 or v22 LTS (built-in modules only — no npm dependencies)
- A dedicated `soapcalc` system user (created during install)

## Install

These steps assume the repo has been copied to the server (e.g. via USB
or `git clone` if the machine has temporary internet access for setup).
Everything afterward works offline.

1. **Copy application files:**

   ```
   sudo mkdir -p /opt/soapcalc
   sudo cp server.js index.html data.json.example /opt/soapcalc/
   ```

2. **Create the system user:**

   ```
   sudo useradd --system --no-create-home --shell /usr/sbin/nologin soapcalc
   ```

3. **Create the data directory:**

   ```
   sudo mkdir -p /var/lib/soapcalc
   sudo chown soapcalc:soapcalc /var/lib/soapcalc
   sudo chmod 750 /var/lib/soapcalc
   ```

   On first run the server seeds `/var/lib/soapcalc/data.json` from
   `data.json.example`; you do not need to copy it by hand.

4. **Install the runtime config:**

   ```
   sudo cp deploy/soapcalc.conf.example /etc/soapcalc.conf
   sudo chmod 644 /etc/soapcalc.conf
   ```

   Edit `/etc/soapcalc.conf` to change the port or bind address if needed.

5. **Install and enable the systemd unit:**

   First confirm where `node` lives on the target machine:

   ```
   which node
   ```

   The shipped unit assumes `/usr/bin/node` (Ubuntu's `nodejs` package and
   the official Node `.deb` install there). If `which node` reports
   something else — e.g. `/usr/local/bin/node` from a manual tarball or
   `nvm` install — edit the `ExecStart=` line in
   `deploy/soapcalc.service` to match before copying it into place.

   ```
   sudo cp deploy/soapcalc.service /etc/systemd/system/soapcalc.service
   sudo systemctl daemon-reload
   sudo systemctl enable --now soapcalc
   ```

6. **Restrict the port to the LAN** (example for `ufw` and a `192.168.1.0/24`
   subnet — adjust to your network):

   ```
   sudo ufw allow from 192.168.1.0/24 to any port 8030 proto tcp
   ```

7. **Verify:**

   ```
   curl http://localhost:8030/health
   ```

   Should return `{"status":"ok"}`.

## Local development

You don't need systemd or the dedicated user to hack on this locally. The
server reads `PORT`, `DATA_FILE`, and `BIND_ADDRESS` from the environment,
so you can point it at a writable file in the repo:

```
DATA_FILE=./data.json PORT=8030 node server.js
```

Then in another terminal:

```
curl http://localhost:8030/health
curl http://localhost:8030/api/data
```

The first request creates `./data.json` from `data.json.example`.
Stop the server with `Ctrl+C`. `data.json` is gitignored, so it stays
out of commits.

## Configuration

`/etc/soapcalc.conf` is a plain `KEY=VALUE` file (loaded by systemd via
`EnvironmentFile`). The same names also work as environment variables, which
take precedence — handy for local testing.

| Key            | Default                          | Notes                                          |
|----------------|----------------------------------|------------------------------------------------|
| `PORT`         | `8030`                           | TCP port to listen on                          |
| `DATA_FILE`    | `/var/lib/soapcalc/data.json`    | Path to the JSON data file                     |
| `BIND_ADDRESS` | `0.0.0.0`                        | Interface to bind (set to a LAN IP to restrict)|

## HTTP surface

- `GET  /` — serves `index.html`
- `GET  /api/data` — returns the full data file as JSON
- `PUT  /api/data` — replaces the data file (atomic write)
- `GET  /health` — returns `{"status":"ok"}`

Writes are atomic: the server writes `<DATA_FILE>.tmp` and then renames it
over `<DATA_FILE>`, so a crash mid-write cannot corrupt the file.

## Backup and restore

The entire application state lives in `/var/lib/soapcalc/data.json`.

- **Backup:** copy that file somewhere safe.
- **Restore:** stop the service, replace the file, restart the service:

  ```
  sudo systemctl stop soapcalc
  sudo cp /path/to/backup.json /var/lib/soapcalc/data.json
  sudo chown soapcalc:soapcalc /var/lib/soapcalc/data.json
  sudo systemctl start soapcalc
  ```

## License

Personal project — no license set yet.
