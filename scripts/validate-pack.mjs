import { readFileSync } from 'node:fs';
import { validatePack } from '../js/pack-schema.js';

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/validate-pack.mjs packs/YYYY-MM-DD.json');
  process.exit(2);
}
const errors = validatePack(JSON.parse(readFileSync(file, 'utf8')));
if (errors.length) {
  console.error(`INVALID ${file}:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`OK ${file}`);
