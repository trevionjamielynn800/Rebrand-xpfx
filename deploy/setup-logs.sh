#!/usr/bin/env bash
set -euo pipefail

# Create application log directories and optionally install logrotate config.
# Run as non-root to create local log folders, or run with sudo to install logrotate.

APP_DIR="${APP_HOME:-$(pwd)}"
PM2_LOG_DIR="$APP_DIR/logs/pm2"
SYSTEM_LOG_DIR="/var/log/xpresspro"

echo "Creating PM2 log directory: $PM2_LOG_DIR"
mkdir -p "$PM2_LOG_DIR"
chmod 0755 "$PM2_LOG_DIR"

if [ "$EUID" -eq 0 ]; then
  echo "Running as root — installing system log dir and logrotate config"
  mkdir -p "$SYSTEM_LOG_DIR"
  chown www-data:www-data "$SYSTEM_LOG_DIR" || true
  if [ -f "$APP_DIR/deploy/xpresspro.logrotate" ]; then
    cp "$APP_DIR/deploy/xpresspro.logrotate" /etc/logrotate.d/xpresspro
    chmod 0644 /etc/logrotate.d/xpresspro
    echo "Installed /etc/logrotate.d/xpresspro"
  else
    echo "No deploy/xpresspro.logrotate found — skipping copying"
  fi
else
  echo "Not running as root — to install system-level logrotate, run with sudo:"
  echo "  sudo $0"
fi

echo "PM2 logs will be written to: $PM2_LOG_DIR"
echo "Setup complete."
