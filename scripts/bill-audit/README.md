# Bill audit — setup walkthrough

Records, from a DeepSeek Harness session export: total agent requests sent,
total tool-call trajectories, and cost at official model list prices.
Stdlib-only Node — no install, no dependencies. Copy this directory anywhere.

## What it is (and is not)

- It REPLAYS the durable session log. It makes no model calls and invents
  nothing: unknown models are reported as unpriced, never priced by guess.
- It does NOT measure the predictive plugin — that is the treatment arm,
  built next (see "Next build"). It measures both arms with the same code.
- Costs are EQUIVALENT official-list-price costs, not amounts billed. The
  plugin's free routes may bill $0; the demo number answers "what this
  workload costs at list prices". The savings PERCENTAGE is the transferable
  claim; both arms share one model and one price table.

## 1. Prerequisites (your machine)

- Node.js 24.9 or newer, Git 2.26 or newer, pnpm pinned in the harness
  `package.json` (11.28.5 at time of writing): `npm install --global pnpm@11.28.5`
- A working model route (free roster, API key, or local server — see step 3).
- API keys, if you use keyed providers, stay in the harness settings / your
  environment. Nothing in this directory ever asks for a key.

## 2. Get the harness (two checkouts — do not confuse them)

- `deepseek-harness` — the fork where code changes land (your two commits:
  Our Free Model integration + first calls through the plugin). This meter
  lives in `scripts/bill-audit/` there.
- `TestingPlatform` — the combined experiment checkout: isolated profile
  (`testing-platform/profile.json`), launcher (`testing-platform/launcher.mjs`),
  and the plugin as `dsh-our-free-model`. DEMO RUNS BELONG HERE: the
  isolated profile keeps demo sessions and config out of your main harness
  home. (It is a full experiment workspace, not just a backup.)

```sh
git clone https://github.com/LUNCY579/deepseek-harness.git
cd deepseek-harness
pnpm install --frozen-lockfile
pnpm run build
pnpm start
```

For an isolated demo home (recommended — demo config never touches `~/.dsh`):

```sh
DSH_HOME="$PWD/.dsh-experiments/our-free-model" pnpm start --no-open
```

TestingPlatform instead: `pnpm run dev` from that checkout launches the
source CLI with the TestingPlatform profile. Either way, keep the terminal
running and open the printed URL including its login token.

## 3. Pick ONE demo model and prove the route

In the Web UI: Settings → Our Free Model → Free models → wait for the
roster (or Refresh roster) → click **Text test** on a model card. It sends
`Reply with exactly: OK` through that model's plugin route; the card shows
timing and the response. (The text test creates no chat session.)

- Use the SAME model for control and treatment. Recommended default:
  `deepseek-flash` (current official model; priced in prices.json). An
  official DeepSeek route is also available via Settings → Models → DeepSeek.
- Write down the EXACT model id the route reports. The reporter prices by
  that id: `deepseek-flash`, `deepseek-v4-pro`, `kimi-k3`, `kimi-k3.1-pro`,
  `kimi-k2.7-code`, `kimi-k2.6` (and highspeed variants) are priced. Any
  other id lands in the unpriced bucket — add a row to prices.json with a
  sourced price rather than letting it stay unpriced.

## 4. Run a task (repeat per task, per arm)

1. Reset the demo target to its pristine commit (see tasks.md reset rule).
2. Open a workspace on the demo-target folder in the harness.
3. Paste the task prompt VERBATIM from tasks.md. Do not coach, correct, or
   re-prompt mid-run — a coached run is not comparable evidence.
4. When the run finishes, export the session: Web UI `/export` command →
   download the session ZIP → unzip it into
   `evidence/<TASK>/<arm>/session-export/`.
5. Fill in `evidence/<TASK>/<arm>/success.md`: task, arm, model id, UTC
   timestamp, pass/fail against that task's success criteria, one line of
   notes. (The reporter cannot judge success; you do.)
6. Run the reporter (from this directory):

```sh
node bill-audit.mjs run --input evidence/<TASK>/<arm>/session-export/ \
  --out evidence/<TASK>/<arm> --arm <control|treatment> --task <TASK> \
  [--success true|false]
```

This writes `meter.json` + `report.md` next to the export. `--success`
records your success judgment in the meter file; omit it and success stays
null (the comparison then shows it as unknown, not as a pass).

## 5. Compare arms (after both arms exist for every task)

Pick ONE evidence layout before you start running:

```sh
# Layout A: separate arm trees (one command for everything)
#   evidence/control/T1/meter.json, evidence/control/T2/meter.json, ...
#   evidence/treatment/T1/meter.json, evidence/treatment/T2/meter.json, ...
node bill-audit.mjs compare --control-dir evidence/control \
  --treatment-dir evidence/treatment --out evidence

# Layout B: per-task folders (tasks.md layout)
#   evidence/T1/control/meter.json, evidence/T1/treatment/meter.json, ...
#   Compare one pair at a time:
node bill-audit.mjs compare --control evidence/T1/control/meter.json \
  --treatment evidence/T1/treatment/meter.json --out evidence/T1
```

In Layout B, add the per-task totals yourself for the all-tasks figure
(the pairs are the evidence; the sum is arithmetic, not a second measurement).

Output: `comparison.json` + `comparison.md` with per-task and total
requests, tool calls, cost, savings $ and %, and success parity.

## 6. Definitions (so the numbers mean one thing)

- **Agent requests**: model-call attempts that reached a provider and
  produced a finalized usage sample. Streaming chunks within one attempt
  replace each other and count once; a retried attempt (after
  `llm/retry-started`) counts again, because it is billed again.
- **Tool-call trajectory**: the ordered tool calls of one task run, taken
  from finalized assistant-message blocks, in session order — plus per-tool
  counts. "Total trajectories" across an evidence pack = number of task
  runs compared.
- **Cost**: tokens × official list price (prices.json), per attempt, by the
  model that served it. DeepSeek peak/off-peak follows the sample's UTC
  timestamp (weekday 01:00–04:00 and 06:00–10:00 UTC = peak).

## 7. Known limitations (read before showing investors)

- Tool calls are counted from finalized assistant-message blocks only.
  If a future log shape records tool calls only as dedicated tool events,
  the trajectory comes out empty and the report warns you — extend
  `blocksOf()` rather than hand-editing numbers.
- Model attribution follows the latest `request/context` record before
  each usage sample (the harness's own priced-route rule). A sample with
  no route is unpriced, not assigned to a guessed model.
- DeepSeek peak windows ignore the Chinese-public-holiday exclusion (no
  holiday calendar bundled) — this can only overstate peak cost.
- Kimi K3 TTL cache-write fees are excluded (usage records carry no TTL),
  so Kimi costs are slightly understated. Both conventions apply equally
  to both arms, so the savings percentage is unaffected.
- Kimi rows are secondary-cross-checked (the official page's price table
  did not render in a text fetch on 2026-10-26); DeepSeek rows were read
  directly off the official docs page. Re-verify Kimi on
  https://platform.moonshot.ai/docs/pricing/chat before investor use —
  the table is versioned, so a correction is a one-line change.

## Next build: the treatment arm (prefetch plugin)

The meter is arm-agnostic; the treatment is a separate plugin on the
harness's native interception seam (from the Oct 22 assessment):

- Hook `tools/pre-execute` (typed allow/deny/ask) to prefetch the top-3
  predicted next READ-ONLY calls in parallel, from the K3 pattern
  predictor (the measured 50.4% top-1 / 83.5% top-3 predictor, not a new
  model).
- `tools/post-execute` substitutes a prefetched result ONLY after a
  freshness recheck; predicted-but-unmade calls are never served; write
  tools are never prefetched.
- Kill switch: disabling the plugin restores plain harness behavior —
  that disabled state IS the control arm, which is why control and
  treatment stay comparable.

Build it on your machine (it needs the harness runtime + pnpm workspace
to verify — it cannot be verified from here), then re-run tasks.md with
the plugin on. That second run is the first real savings evidence.
