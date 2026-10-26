// Self-test for bill-audit.mjs. Runs the real CLI on fixtures and asserts
// exact totals. Run: node selftest.mjs   (exit 0 = all pass)
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = join(HERE, 'bill-audit.mjs');
const FX = join(HERE, 'fixtures');
const tmp = mkdtempSync(join(tmpdir(), 'bill-audit-test-'));
const run = (args) => execFileSync('node', [CLI, ...args], { encoding: 'utf8' });
const approx = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `expected ${b}, got ${a}`);
const load = (p) => JSON.parse(readFileSync(p, 'utf8'));

try {
  // Control: streaming sample replaced by final (1 attempt), retry adds (1),
  // tool_result blocks excluded, off-peak DeepSeek Flash pricing.
  run(['run', '--input', join(FX, 'control.json'), '--out', join(tmp, 'control'), '--arm', 'control', '--task', 'T1', '--success', 'true']);
  const c = load(join(tmp, 'control', 'meter.json'));
  assert.equal(c.requests.attempts, 4);
  assert.equal(c.requests.retries, 1);
  assert.equal(c.tokens.inputTokens, 57000);
  assert.equal(c.tokens.outputTokens, 9000);
  assert.equal(c.tokens.cacheReadTokens, 5000);
  assert.equal(c.tokens.cacheWriteTokens, 1000);
  approx(c.cost.usd, 0.013965);
  assert.equal(c.trajectory.toolCalls, 4);
  assert.deepEqual(c.trajectory.perTool, { read_file: 2, grep_search: 1, edit_file: 1 });
  assert.equal(c.run.success, true);
  assert.ok(existsSync(join(tmp, 'control', 'report.md')));

  // Treatment: fewer requests, fewer tool calls.
  run(['run', '--input', join(FX, 'treatment.json'), '--out', join(tmp, 'treatment'), '--arm', 'treatment', '--task', 'T1', '--success', 'true']);
  const t = load(join(tmp, 'treatment', 'meter.json'));
  assert.equal(t.requests.attempts, 2);
  assert.equal(t.trajectory.toolCalls, 2);
  approx(t.cost.usd, 0.003612);

  // Compare: exact savings math.
  run(['compare', '--control-dir', join(tmp, 'control'), '--treatment-dir', join(tmp, 'treatment'), '--out', join(tmp, 'cmp')]);
  const cmp = load(join(tmp, 'cmp', 'comparison.json'));
  assert.equal(cmp.totals.tasks, 1);
  approx(cmp.savings.costUsd, 0.010353);
  approx(cmp.savings.costPct, 74.135338, 1e-3);
  assert.equal(cmp.totals.control.success, 1);
  assert.equal(cmp.totals.treatment.success, 1);

  // Peak: Monday 02:00 UTC prices at peak Flash rates.
  run(['run', '--input', join(FX, 'peak.json'), '--out', join(tmp, 'peak'), '--arm', 'control', '--task', 'P1']);
  const p = load(join(tmp, 'peak', 'meter.json'));
  approx(p.cost.usd, 0.00543);
  assert.equal(p.attempts[0].ratePeriod, 'peak');

  // Unpriced: never guessed; cost 0 with a warning, tokens still counted.
  run(['run', '--input', join(FX, 'unpriced.json'), '--out', join(tmp, 'unpriced'), '--arm', 'control', '--task', 'U1']);
  const u = load(join(tmp, 'unpriced', 'meter.json'));
  assert.equal(u.cost.usd, 0);
  assert.equal(u.cost.pricedAttempts, 0);
  assert.equal(u.tokens.inputTokens, 1000);
  assert.ok(u.warnings.some((w) => w.includes('Unpriced')));

  console.log('bill-audit self-test: ALL PASS');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
