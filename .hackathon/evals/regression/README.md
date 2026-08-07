# Regression evals

Regression evals protect behavior that must remain true while Memory Knee evolves.
They do not turn synthetic inputs into measured evidence.

Required regression invariants:

- `event_key` and `trace_id` remain stable across artifacts.
- Every pre-run workload and unexecuted result is labeled
  **PRERUN · SYNTHETIC**.
- Candidate `top_k` budgets are positive, unique, and evaluated in ascending
  order.
- The full-history and EverMind arms use the same corpus, queries, model, and
  scoring contract.
- Missing facts, malformed IDs, and unsupported memory citations count as
  failures, never successes.
- A `top_k` cannot be recommended with missing token/cost measurements,
  preservation failures, or insufficient repetitions.
- The recommendation is deterministic for the same observations and safety
  envelope.
- Raw evidence is never overwritten by an aggregate.
- Snowflake/Cortex does not become a build or runtime dependency while it is on
  hold.
- Cognee remains preparation memory, not shipped product memory.
- EverMind remains required and load-bearing; the optimized arm must use the
  real v2 `add`, `flush`, and `search` operations and cannot silently downgrade
  to an in-memory or mocked substitute.
- Missing credentials or an unavailable EverMind service produces an explicit
  incomplete state, never a synthetic recommendation.
- Submission validation continues to require team name, project name, member
  fields, and slide deck URL; a live demo remains optional.

Run the repository-level portion with:

```bash
python -m pytest -q tests/test_repo_contract.py
```
