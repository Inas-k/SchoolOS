// Gate runner.
//   node gate.mjs [cycle=1] [cloneUrl=http://127.0.0.1:4173/] [--skip-original]
// 1. snapshots the clone's computed styles at 3 viewports (tools/snapshot.mjs)
// 2. builds assertions from the ORIGINAL's snapshot (ground truth, read from the live page)
// 3. runs _method/scripts/assert-styles.mjs per viewport (the official gate)
// 4. runs a STRICT pass too (exact string match; +-1px only for pure single-length values),
//    because assert-styles.mjs only compares the first number of composite values.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const WS = `${ROOT}/clone-workspace/skooly`;
const cycle = process.argv[2] || '1';
const cloneUrl = process.argv[3] || 'http://127.0.0.1:4173/';
const outDir = `${WS}/06-qa/cycle-${cycle}`;
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(`${WS}/03-design-spec`, { recursive: true });

const orig = JSON.parse(fs.readFileSync(`${WS}/02-extraction/original-snapshot.json`));
const cloneFile = `${outDir}/clone-snapshot.json`;
execFileSync('node', [`${ROOT}/tools/snapshot.mjs`, cloneUrl, cloneFile], { stdio: 'inherit' });
const clone = JSON.parse(fs.readFileSync(cloneFile));

const PURE_LEN = /^-?\d+(\.\d+)?px$/;
const strictEq = (prop, exp, act) => {
  if (exp === act) return true;
  if (act == null) return false;
  if (PURE_LEN.test(String(exp)) && PURE_LEN.test(String(act))) return Math.abs(parseFloat(exp) - parseFloat(act)) <= 1;
  if (prop === '__w' || prop === '__h') return Math.abs(exp - act) <= 1;
  return false;
};

const summary = { cycle: Number(cycle), viewports: {}, build_ok: true };
let totalFailed = 0;
const allAssertions = [];
for (const vp of Object.keys(orig)) {
  const o = orig[vp], c = clone[vp] || {};
  const assertions = [], cloneStyles = {};
  const strictFailures = [];
  for (const sel of Object.keys(o)) {
    cloneStyles[sel] = c[sel] || {};
    for (const [prop, exp] of Object.entries(o[sel])) {
      assertions.push({ selector: sel, prop, expected: exp });
      if (!strictEq(prop, exp, (c[sel] || {})[prop])) strictFailures.push({ selector: sel, prop, expected: exp, actual: (c[sel] || {})[prop] ?? null });
    }
  }
  const extra = Object.keys(c).filter((s) => !(s in o));
  const aPath = `${WS}/03-design-spec/assertions.${vp}.json`;
  const cPath = `${outDir}/clone-styles.${vp}.json`;
  const mPath = `${outDir}/metrics.${vp}.json`;
  fs.writeFileSync(aPath, JSON.stringify(assertions));
  fs.writeFileSync(cPath, JSON.stringify(cloneStyles));
  const r = spawnSync('node', [`${ROOT}/_method/scripts/assert-styles.mjs`, '--assertions', aPath, '--clone-styles', cPath, '--out', mPath], { encoding: 'utf8' });
  const official = JSON.parse(fs.readFileSync(mPath)).style_assertions;
  const missing = Object.keys(o).filter((s) => !(s in c));
  summary.viewports[vp] = {
    official: { total: official.total, passed: official.passed, failed: official.failed },
    strict: { total: assertions.length, failed: strictFailures.length },
    missing_elements: missing.length,
    extra_elements: extra.length,
  };
  totalFailed += official.failed + strictFailures.length + missing.length + extra.length;
  fs.writeFileSync(`${outDir}/failures.${vp}.json`, JSON.stringify({ missing, extra, strict: strictFailures.slice(0, 4000) }, null, 1));
  console.log(`[${vp}] official ${official.passed}/${official.total} (failed ${official.failed}) | strict failed ${strictFailures.length}/${assertions.length} | missing ${missing.length} | extra ${extra.length}`);
  const byProp = {};
  strictFailures.forEach((f) => (byProp[f.prop] = (byProp[f.prop] || 0) + 1));
  const top = Object.entries(byProp).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (top.length) console.log('   top failing props:', top.map(([p, n]) => `${p}:${n}`).join(', '));
}
summary.total_failures = totalFailed;
fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(summary, null, 2));
console.log(totalFailed === 0 ? 'GATE: PASS' : `GATE: FAIL (${totalFailed})`);
process.exit(totalFailed === 0 ? 0 : 1);
