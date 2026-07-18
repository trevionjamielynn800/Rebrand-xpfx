/**
 * PM2 process config for VPS deployments — XpressPro FX API Server
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs          # start / restart
 *   pm2 reload ecosystem.config.cjs         # zero-downtime reload
 *   pm2 stop xpressfx-api                   # stop
 *   pm2 delete xpressfx-api                 # remove from PM2 list
 *   pm2 save                                # persist current process list across reboots
 *   pm2 startup                             # generate systemd/init script for auto-start
 *   pm2 logs xpressfx-api                  # tail logs
 *
 * Rollback:
 *   git checkout <previous-sha>             # revert code
 *   npm ci                                  # restore deps
 *   npm run build -w @workspace/api-server  # rebuild
 *   pm2 reload ecosystem.config.cjs
 */

module.exports = {
  apps: [
    {
      name: "xpressfx-api",
      script: "node",
      args: "--enable-source-maps artifacts/api-server/dist/index.mjs",

      // Environment — all secrets must be in /etc/xpressfx.env or ~/.env or
      // exported in the shell before calling `pm2 start`.
      // Never hardcode secrets here.
      env: {
        NODE_ENV: "production",
        LOG_LEVEL: "info",
      },

      // Restart policy: ON_FAILURE only, with capped exponential backoff.
      // NOT set to max_restarts: Infinity — a persistent crash should page you,
      // not loop silently forever burning resources.
      autorestart: true,
      max_restarts: 10,
      min_uptime: "5s",   // must stay alive for 5s to count as a successful start
      restart_delay: 2000, // 2s initial delay before first restart
      exp_backoff_restart_delay: 100, // PM2 doubles this each attempt (100→200→400…)

      // Logging — PM2 captures stdout/stderr.
      // Rotate logs with: pm2 install pm2-logrotate
      out_file: "/var/log/xpressfx/out.log",
      error_file: "/var/log/xpressfx/error.log",
      merge_logs: true,
      time: true,

      // Watch mode OFF — use explicit deploys, not file watching in production.
      watch: false,

      // Cluster mode OFF — the app uses in-memory state; multiple workers would
      // each have their own store, causing split-brain. Run one instance.
      instances: 1,
      exec_mode: "fork",
    },
  ],
};
