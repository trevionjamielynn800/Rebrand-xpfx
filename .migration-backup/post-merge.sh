#!/bin/bash
set -e
pnpm install --frozen-lockfile --no-audit --no-fund
pnpm run push -w @workspace/db
