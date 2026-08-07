# Memory Knee

> **PRERUN · SYNTHETIC** — this repository currently contains a product contract,
> planned workloads, and evaluation scaffolding. It does not contain measured
> benchmark results.

Memory Knee asks a practical question: **how little retrieved memory can an AI
job use without forgetting what matters?** It compares a full-history context
baseline with real EverMind / EverOS (Memory OS) retrieval at progressively larger
`top_k` budgets. The recommendation is the smallest retrieval budget that
preserves baseline recall and entity/ID integrity while producing a measured
reduction in context tokens and input cost.

## Working agreement

- **Codex is the sole build environment.** Product work and repository setup are
  performed with Codex.
- **Snowflake and Cortex are on hold and excluded from this build.** The retained
  `event_key` is an opaque event identifier; it does not imply a Snowflake or
  Cortex dependency.
- **Cognee is preparation memory only.** It may help organize hackathon research
  and build context, but it is not the product memory layer.
- **EverMind / EverOS is the measured product path.** A valid Memory Knee
  result requires the real service; it cannot be replaced with a badge,
  screenshot, local list, or mock.
- **The confirmed current API surface is v2 `add`, `flush`, and `search`.** The
  official Cloud wire contract and Python SDK are now pinned, and the local
  credential has passed a non-mutating authenticated v2 `search` probe. The real
  benchmark corpus has not been ingested or evaluated yet.

## Product contract

For a deterministic memory corpus and query set, Memory Knee will:

1. run a full-history baseline using the complete eligible memory context;
2. ingest the same corpus through EverMind v2 `add` and commit it with `flush`;
3. retrieve query context through EverMind v2 `search` at each declared `top_k`;
4. score answer recall and exact entity/ID integrity against the baseline and
   ground truth;
5. measure the actual context tokens sent to the model and calculate input cost
   from a recorded pricing snapshot; and
6. recommend the smallest `top_k` that preserves the quality gates, reporting
   real token and cost reduction relative to full history.

EverMind is load-bearing: without a successful real `add` → `flush` → `search`
path, there is no valid optimized arm and therefore no Memory Knee result. The UI
must show the run as incomplete rather than substitute fake or ephemeral memory.
A labeled test double may exercise a local interface in tests, but it cannot
satisfy the production-integration capability gate.

## Measured means measured

The planned quality gates and retrieval budgets are configuration, not results.
The eventual token and cost claims must come from captured model inputs, actual
token counting, and a versioned price used for the run. The benchmark must not
estimate reduction from character counts or present synthetic expectations as
observations.

The initial preservation rule requires exact ID integrity and no recall loss
relative to the full-history baseline. Planned `top_k` values, synthetic corpus
scenarios, measurement fields, and empty result slots live in
[`data/workload.json`](data/workload.json).

## Repository contract

- [`.hackathon/event.json`](.hackathon/event.json) is the canonical event,
  deadline, submission, tool, and memory contract.
- [`.hackathon/trace.jsonl`](.hackathon/trace.jsonl) is the append-only execution
  trace.
- [`.hackathon/evidence/`](.hackathon/evidence/) holds artifacts that support
  product claims.
- [`.hackathon/evals/`](.hackathon/evals/) separates capability checks from
  regression checks.
- [`tests/test_repo_contract.py`](tests/test_repo_contract.py) protects the
  non-negotiable repository contract.

Create the ignored local environment and install the pinned runtime and test
dependencies with:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -e '.[test]'
```

Run the focused contract check with:

```bash
.venv/bin/python -m pytest -q tests/test_repo_contract.py
```

## Secure EverOS connection

Memory Knee uses the official `everos-cloud==1.0.0` client and resolves
`EVEROS_API_KEY` only at runtime. The process environment takes precedence; the
repository's ignored `.env` is the local fallback. The credential is never
written to event, workload, trace, evidence, or benchmark artifacts.
The wire contract follows the
[official full EverOS API reference](https://docs.evermind.ai/llms-full.txt).

For a new checkout, create local configuration from the blank template and put
the real value only in `.env`:

```bash
(umask 077 && cp -n .env.example .env)
chmod 600 .env
```

Verify authentication with a non-mutating v2 search:

```bash
.venv/bin/cost-knee --check-everos
```

A successful check emits only a redacted status object with
`"connected": true`. It does not add or flush memory, print search results, or
make the synthetic preflight a valid Memory Knee result.

Deal Witness uses a dedicated EverOS Memory Space named **Deal Witness** in
**Team Collaboration** scenario mode. EverOS API keys are bound to a Memory
Space, so the local `EVEROS_API_KEY` must belong to that space rather than
`default_space`. Before loading the demo corpus, run the bounded synthetic
bootstrap probe:

```bash
.venv/bin/python scripts/verify_deal_witness_space.py --write
```

The probe adds four wholly synthetic messages from two participants, flushes
the session, and succeeds only when EverOS returns separately attributed
episodes for both people. It never prints the credential or generated memory
contents.

## Submission clock

- Internal feature and content freeze: **2026-08-07 14:30 PDT**
- Hard submission deadline: **2026-08-07 16:00 PDT**
- Live demo URL: optional

Before the internal freeze, the submission still needs a team name, completed
member fields, and a slide deck URL. The working project name is **Memory Knee**. Missing
submission values remain explicit `null` values in the event contract so they
cannot be mistaken for completed work.
