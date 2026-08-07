# Capability evals

Capability evals answer whether Memory Knee can perform its promised job. All eval
results are pending; the current workload is **PRERUN · SYNTHETIC**.

Minimum capability gates:

1. **Comparable baseline** — answer every evaluation query with the full eligible
   memory history and capture the exact context sent to the model.
2. **Real EverMind path** — ingest the same corpus through v2 `add`, commit it
   through `flush`, and retrieve through `search` for every configured `top_k`.
3. **Recall integrity** — score returned facts against ground truth and the
   full-history baseline.
4. **ID integrity** — preserve canonical entity IDs and cite the supporting
   memory IDs exactly; a plausible but wrong ID is a failure.
5. **Token integrity** — count the exact context tokens for every arm using the
   recorded tokenizer, not a character-count estimate.
6. **Cost integrity** — calculate input cost from observed tokens and a
   timestamped price snapshot tied to the run.
7. **Knee recommendation** — return the smallest `top_k` meeting every
   preservation gate and report measured token/cost reduction against full
   history.
8. **Evidence lineage** — link every displayed claim to raw evidence and a trace
   span.
9. **Memory failure behavior** — when the real EverMind arm cannot run, surface
   an incomplete benchmark and never substitute mock results.

The local Cloud credential has passed a non-mutating authenticated v2 `search`
probe. The official v2 wire contract is confirmed for `add`, `flush`, and
`search`, but the benchmark corpus has not been ingested or evaluated. A labeled
test double may exercise the local adapter interface, but it cannot satisfy the
real-EverMind gate.
