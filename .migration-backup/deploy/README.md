# Deploying XpressPro FX (systemd)

This document shows a minimal example to run the app as a `systemd` service on a VPS.

1. Copy the repository to the VPS, e.g. `/var/www/rebranded-xpfx`.
2. Update the `deploy/xpresspro.service` file:
   - Set `WorkingDirectory` to the app path.
   - Set `ExecStart` to the location of `start.sh`.
   - Replace `User` with the system user that should run the app (e.g. `www-data` or `ubuntu`).

3. Install the service:

```bash
sudo cp deploy/xpresspro.service /etc/systemd/system/xpresspro.service
sudo systemctl daemon-reload
sudo systemctl enable xpresspro.service
sudo systemctl start xpresspro.service
sudo systemctl status xpresspro.service
sudo journalctl -u xpresspro.service -f
```

4. Environment and secrets

- Place production environment variables in `/etc/xpressfx.env` (the `start.sh` script will source it).
- Ensure `SESSION_SECRET`, `DATABASE_URL`, and other production secrets are set in that file or via your platform's secret manager.

5. Notes

- The `start.sh` script will install dependencies (including dev deps) and build the TypeScript server and frontend if `BUILD_ALL=true` is set.
- For CI/deploy pipelines prefer using the `railpack.json` / `railway.json` configuration instead of `start.sh`.
XpressPro FX — VPS deployment notes

Install systemd service (example):

1. Copy the environment file to the VPS: `/etc/xpressfx.env` and set values.
2. Copy the `start.sh` script and the repo to `/workspaces/Rebranded-xpfx` or adjust `WorkingDirectory` in the unit.
3. Install the systemd unit:

```bash
sudo cp deploy/xpresspro.service /etc/systemd/system/xpresspro.service
sudo systemctl daemon-reload
sudo systemctl enable xpresspro.service
sudo systemctl start xpresspro.service
sudo journalctl -u xpresspro.service -f
```

Notes:
- The service uses `start.sh` which installs dev dependencies locally for builds
  (it sets `NPM_CONFIG_PRODUCTION=false`) so `tsc` is available during startup.
- Use `/etc/xpressfx.env` to set production environment variables like `PORT`,
  `NODE_ENV`, `SESSION_SECRET`, and `DATABASE_URL`.
