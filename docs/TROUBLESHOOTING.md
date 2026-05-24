# Troubleshooting

Common problems and how to fix them. Each section starts with a symptom —
find the one that matches what you're seeing.

If nothing here matches, see [Something else is broken](#something-else-is-broken)
at the bottom.

---

## The service won't start

**Symptom:** `sudo systemctl status soapcalc` shows `failed`, `inactive (dead)`,
or any state other than `active (running)`.

The fastest way to diagnose this is to look at the logs. The very last
few lines almost always say why the service failed:

```
sudo journalctl -u soapcalc -n 50
```

Read the last 5–10 lines. The error message will usually point you at
one of these:

### 1. Port already in use

If you see `EADDRINUSE` or `address already in use`, something else on
the server is already using port 8030. Either stop whatever is using the
port, or pick a different port in `/etc/soapcalc.conf`:

```
sudo nano /etc/soapcalc.conf
```

Change the `PORT=` line, save with `Ctrl+O` and `Enter`, exit with
`Ctrl+X`, then:

```
sudo systemctl restart soapcalc
```

If you changed the port, remember to also update your firewall (see
Step 9 in INSTALL.md) and the URL you use from your phone.

### 2. Data file or directory missing

If you see something like `ENOENT` or `no such file or directory`, the
data directory probably doesn't exist or has the wrong permissions.
Check it:

```
ls -la /var/lib/ | grep soapcalc
```

You should see a line showing `/var/lib/soapcalc/` owned by the
`soapcalc` user. If it's missing, recreate it:

```
sudo mkdir -p /var/lib/soapcalc
sudo chown soapcalc:soapcalc /var/lib/soapcalc
sudo chmod 750 /var/lib/soapcalc
```

### 3. Permission denied

If you see `EACCES` or `permission denied`, the `soapcalc` user can't
read or write its own data directory. Fix the ownership:

```
sudo chown -R soapcalc:soapcalc /var/lib/soapcalc
```

### 4. Wrong Node version or Node not found

If you see `node: command not found` or an error mentioning a Node
syntax feature, your Node install isn't in the place the service
expects. Check what Node you have:

```
node --version
which node
```

The version should start with `v20`, `v22`, or higher. If `which node`
returns something other than `/usr/bin/node` — for example
`/usr/local/bin/node` from a manual install or `~/.nvm/versions/...` from
nvm — edit the service file to point at the right path:

```
sudo nano /etc/systemd/system/soapcalc.service
```

Find the line starting with `ExecStart=` and change `/usr/bin/node` to
the full path from `which node`. Save and exit, then:

```
sudo systemctl daemon-reload
sudo systemctl restart soapcalc
```

### After any fix

Whenever you change a service file or its environment, re-run:

```
sudo systemctl daemon-reload
sudo systemctl restart soapcalc
sudo systemctl status soapcalc
```

If the status still isn't `active (running)`, check the logs again with
`sudo journalctl -u soapcalc -n 50` — the error should now be different
(or the same, if your fix didn't take).

---

## I can't reach the calculator from my phone

(Or from a tablet, or another computer.)

**Symptom:** `http://<server-ip>:8030` doesn't load on another device,
but the calculator works fine on the server itself (for example,
`curl http://localhost:8030/health` from the server returns `{"status":"ok"}`).

Likely causes, in order of how often they're the culprit:

### 1. Wrong IP address

It's easy to write down a typo. On the server, double-check:

```
ip addr show
```

Look at the `inet` line in the right interface block (see
[INSTALL.md Step 1](INSTALL.md#step-1-find-your-servers-ip-address)).
Compare the IP carefully — `192.168.1.42` and `192.168.1.142` are easy
to confuse.

While you're checking IPs, also make sure your phone is on the **same**
Wi-Fi network as the server. Many homes have a "guest" Wi-Fi that's
isolated from the main network, which would explain "works on my laptop,
doesn't work on my phone."

### 2. Firewall blocking the port

If Ubuntu's firewall (`ufw`) is active, it may be blocking incoming
connections on port 8030. Check:

```
sudo ufw status
```

If the status is `active` and `8030/tcp` (or your custom port) isn't in
the allowed list, allow it:

```
sudo ufw allow 8030/tcp
```

(If you're using a custom port, substitute that number.)

### 3. Service not actually running

You can reach `localhost:8030` from the server itself even if the service
crashed and got restarted — but it's worth a sanity check:

```
sudo systemctl status soapcalc
```

If it's not `active (running)`, see
[The service won't start](#the-service-wont-start).

### 4. Wi-Fi "AP isolation" enabled on the router

Some home routers have a setting variously called "AP isolation,"
"client isolation," or "wireless isolation" that prevents devices on
the same Wi-Fi network from talking to each other. If you've ruled out
everything else, check your router's admin page for this setting and
turn it off.

### 5. Wrong port in the URL

If you changed the port in `/etc/soapcalc.conf`, you need to use the new
port in the URL — `http://192.168.1.42:9000` rather than `:8030`. (And
you need to have allowed the new port through `ufw` if it's active.)

---

## The calculator didn't come back up after a reboot

**Symptom:** after `sudo reboot`, the calculator URL no longer works from
any device — not from the server, not from your phone.

### 1. The service wasn't enabled for autostart

There's a difference between "running right now" and "configured to start
on boot." If you only ever ran `sudo systemctl start soapcalc` (without
`enable`), the service won't come back after a reboot.

Enable it:

```
sudo systemctl enable soapcalc
```

Then reboot again to confirm:

```
sudo reboot
```

After it comes back up (~30 seconds), check the URL from your phone.

### 2. The service is enabled but crashing on startup

If it's enabled and still not running, something is failing at boot.
Check the status and logs:

```
sudo systemctl status soapcalc
sudo journalctl -u soapcalc -n 50
```

Then see [The service won't start](#the-service-wont-start).

### 3. The server didn't actually reboot

If you ran `sudo reboot` but the server's uptime suggests otherwise, the
reboot may not have happened. Check:

```
uptime
```

If it shows a long uptime (days or weeks), the reboot didn't take effect.
Try again — and if it still doesn't reboot, that's a problem outside
this app's scope (probably hardware or Ubuntu config).

---

## I changed a factor and now the numbers don't look right

**Symptom:** recipes calculate differently than you expect, or saved
recipes look wrong when you load them.

**Cause:** something edited a factor in Settings — either you, or someone
else on the network, or an accidental tap.

### Restore the defaults

The fastest fix: open **⚙ Settings**, click **Reset to defaults**, then
**Save**. This restores every factor (including both essential oil
factors) to the values from the original spreadsheet.

The full default values, for reference:

| Ingredient | Factor |
|---|---|
| Lard | 1.0 |
| Coconut Oil | 0.2512195122 |
| Lye | 0.1731707317 |
| Water | 0.4756097561 |
| Essential Oil (Heavy) | 0.06097560975609760 |
| Essential Oil (Light) | 0.03658536585 |

### If you actually meant to change a factor

If your own recipe legitimately uses different ratios and you want to
keep the change, that's fine — but note that changing a factor affects
**all** recipes, including saved ones. There's no per-recipe factor
override in this version. If you want one recipe with custom ratios and
another with defaults, you'll need to switch the factors before loading
each.

---

## I can't find a batch I'm sure I saved

**Symptom:** a batch you remember saving doesn't appear in the Batches
list.

### 1. A search or filter is hiding it

The Batches tab has a search bar and a filters panel. If either is
active, batches that don't match are hidden. Check:

- Is there text in the search bar? Clear it (the **×** on the right
  side of the search box).
- Is the Filters label showing a count, like **▸ Filters (2)**? Expand
  it and click **Clear filters**, or click the inline **Clear filters**
  link in the collapsed view.

The "Showing N of M batches" line above the list also tells you when
filtering is hiding things — if N is smaller than M, something is being
filtered out.

### 2. You're on a different device or server

Batches live on the specific server they were saved on. If you've set
up the calculator on a new machine, the new install starts with zero
batches. Same as recipes — see [I think I lost my saved recipes](#i-think-i-lost-my-saved-recipes)
below for the full explanation.

### 3. The data file got corrupted or reset

Rare but possible. Check the server:

```
ls -la /var/lib/soapcalc/data.json
```

If the file is missing or 0 bytes, the service will recreate it empty
the next time it starts. If you have a backup, restore it (see
[I think I lost my saved recipes](#i-think-i-lost-my-saved-recipes)
for the restore steps).

---

## A batch's status seems wrong

**Symptom:** a batch shows **Curing** when you expected **Ready!**, or
vice versa.

### 1. The cure time setting changed

Status depends on cure time. The default is 35 days, but it can be
changed in Settings (see
[I changed a factor and now the numbers don't look right](#i-changed-a-factor-and-now-the-numbers-dont-look-right)
above — same kind of issue).

If you recently changed the default cure time, batches without their
own override will use the new value. To check: open **⚙ Settings** and
look at the **Default cure time (days)** field.

### 2. The batch has a per-batch override

A specific batch can have its own cure time, separate from the
default. Open the batch's detail view and look at the **Cure time**
line — if it says something like "42 days (overridden — default is
35)", that batch is using its own value.

To remove the override and use the default again, click **Edit** next
to the cure time and uncheck **Override cure time**, then **Save**.

### 3. The date_made is wrong

Batches are immutable on date once created — if you saved a batch with
the wrong date, it can't be edited. The fix is to delete the batch
and create a new one with the correct date.

---

## I can't edit a batch's date or ingredients

**Symptom:** the batch detail view shows the date and ingredients as
read-only — there's no way to change them.

**This is intentional.** Batches are historical records of what you
actually made. Allowing date or ingredient edits would silently change
the historical record in ways that affect maturity calculations and
break the trust that "this is what I actually did on that day."

If you got something wrong when saving the batch, the fix is:

1. Delete the incorrect batch (button at the bottom of the detail
   view, in red).
2. Create a new batch with the correct information.

If the only thing wrong is the name, the cure-time override, or the
notes — those **are** editable. Just the date and ingredients are
locked.

---

## I think I lost my saved recipes

**Symptom:** the Load Recipe modal is empty, or shows fewer recipes than
you remember saving.

### 1. You're on a different server

Recipes are stored on the specific server they were saved on. If you've
set up the calculator on more than one machine, or reinstalled, the new
install starts with no recipes.

Check that the URL you're using points at the right server's IP.

### 2. The data file was deleted or got corrupted

The calculator stores everything in `/var/lib/soapcalc/data.json`. If
that file is missing or empty, the service will recreate it with
defaults and zero recipes the next time it starts. Check:

```
ls -la /var/lib/soapcalc/
```

If `data.json` is missing or 0 bytes in size, and you have a backup,
restore it. Stop the service first, restore the file, fix ownership,
and start the service again:

```
sudo systemctl stop soapcalc
sudo cp ~/soapcalc-backup.json /var/lib/soapcalc/data.json
sudo chown soapcalc:soapcalc /var/lib/soapcalc/data.json
sudo systemctl start soapcalc
```

(If you don't have a backup, see "Back up your data" in
[INSTALL.md](INSTALL.md#back-up-your-data) — the next time you have
working recipes, it's worth setting up a copy somewhere safe.)

### 3. You're connected to a different network

If you save recipes on the home network and then try to load them while
on cellular data or a coffee shop's Wi-Fi, you can't reach the server at
all — the URL points to a LAN IP that only resolves on your home network.
The recipes are fine; you just can't see them from where you are.

---

## I want to update to a newer version of the calculator

Not really a problem, but you may have ended up here looking for it.

1. Reconnect the server to the internet (temporarily).
2. Pull the latest code and restart the service:

```
cd /opt/soapcalc
sudo git pull
sudo systemctl restart soapcalc
```

3. Disconnect the server's internet again if that's how you prefer to
   run it.

Your recipes are preserved across updates. They live in
`/var/lib/soapcalc/data.json`, which is separate from the application
code in `/opt/soapcalc/`.

---

## Something else is broken

If none of the above match what you're seeing:

### 1. Capture the recent logs

The logs contain the most useful diagnostic information. Save them to a
file you can read at your own pace:

```
sudo journalctl -u soapcalc -n 100 > ~/soapcalc-logs.txt
```

Then open `~/soapcalc-logs.txt` with `less ~/soapcalc-logs.txt` (press
`q` to quit) and look at the last several entries.

### 2. Re-run the verification steps from INSTALL.md

Each step in [INSTALL.md](INSTALL.md) has a `✓ Verify` callout for its
expected outcome. Run the ones that apply to your problem — for example,
if you can't reach the calculator from your phone, re-run the
`curl http://localhost:8030/health` check from Step 8 on the server
itself first, to narrow down whether the problem is the service or the
network.

### 3. Start fresh, keeping your recipes

If you suspect something is wrong with the configuration but you don't
want to lose your saved recipes:

```
sudo systemctl stop soapcalc
sudo mv /var/lib/soapcalc/data.json /var/lib/soapcalc/data.json.bak
sudo systemctl start soapcalc
```

The service will recreate `data.json` with defaults and zero recipes. If
that gets things working, you can then carefully merge anything you want
from `data.json.bak` (the `recipes` array in particular) into the new
file, or restore the whole backup if it turned out to be fine.
