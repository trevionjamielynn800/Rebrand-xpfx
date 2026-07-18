#!/usr/bin/env node
/**
 * Generate missing environment secrets
 * - SESSION_SECRET, COOKIE_SECRET, ADMIN_SECRET, ENCRYPTION_KEY
 * - Only writes keys that are missing or empty
 * - Never overwrites existing values
 * - Appends to .env file
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(path.dirname(__dirname), '.env');

const secrets = {
  SESSION_SECRET: () => crypto.randomBytes(64).toString('hex'),
  COOKIE_SECRET: () => crypto.randomBytes(64).toString('hex'),
  ADMIN_SECRET: () => crypto.randomBytes(32).toString('hex'),
  ENCRYPTION_KEY: () => crypto.randomBytes(32).toString('hex'),
};

// Read existing .env file
let envContent = '';
let existingKeys = {};

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf-8');
  // Parse existing keys
  envContent.split('\n').forEach(line => {
    const [key] = line.split('=');
    if (key && key.trim()) {
      existingKeys[key.trim()] = true;
    }
  });
}

// Generate missing secrets
const generated = [];
const existing = [];
let newContent = envContent;

Object.entries(secrets).forEach(([key, generator]) => {
  if (existingKeys[key]) {
    existing.push(key);
  } else {
    const value = generator();
    newContent += (newContent.endsWith('\n') ? '' : '\n') + `${key}=${value}\n`;
    generated.push(key);
  }
});

// Write back to .env
if (generated.length > 0) {
  fs.writeFileSync(envPath, newContent, 'utf-8');
  console.log('✓ Generated secrets:');
  generated.forEach(k => console.log(`  - ${k}`));
}

if (existing.length > 0) {
  console.log('✓ Already exists:');
  existing.forEach(k => console.log(`  - ${k}`));
}

if (generated.length === 0 && existing.length === 0) {
  console.log('ℹ No secrets to generate');
} else {
  console.log(`\n✓ Environment file updated: ${envPath}`);
}

process.exit(0);
