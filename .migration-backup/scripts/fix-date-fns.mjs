import { existsSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dateFnsDir = path.resolve(__dirname, '..', 'node_modules', 'date-fns');
const shimPath = path.join(dateFnsDir, 'max.mjs');

if (existsSync(dateFnsDir)) {
  if (!existsSync(shimPath)) {
    try {
      writeFileSync(
        shimPath,
        ["import maxModule from './max.js';", '', 'export const max = maxModule.max;', 'export default maxModule.max;', ''].join('\n'),
        'utf8'
      );
      console.log('[fix-date-fns] created max.mjs shim for date-fns');
    } catch (err) {
      console.warn('[fix-date-fns] failed to create shim:', err.message);
    }
  } else {
    console.log('[fix-date-fns] max.mjs already present');
  }
} else {
  console.log('[fix-date-fns] date-fns not yet installed, skipping');
}
