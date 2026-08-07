# Evidence

This directory holds the artifacts that support Memory Knee's claims.

Current status: **PRERUN · SYNTHETIC**. No measured retrieval knee, context-token
reduction, input-cost saving, recall score, or ID-integrity claim exists yet.

## Evidence rules

1. Preserve raw observations; derived summaries do not replace them.
2. Label every artifact as one of `PRERUN · SYNTHETIC`, `MEASURED · TEST`, or
   `MEASURED · LIVE`.
3. Record the workload ID, arm (`full_history` or `evermind_top_k`), `top_k` when
   applicable, repetition, timestamp, model/tokenizer/pricing configuration, and
   trace/span IDs with each observation.
4. Keep credentials, tokens, prompts containing private data, and unredacted
   personal information out of the repository.
5. Do not promote an artifact into a slide or product claim until a matching eval
   passes.
6. Keep EverMind evidence honest: mocked adapter output is test evidence only;
   a valid product result requires the real v2 `add`, `flush`, and `search` path.
7. Preserve the exact model context or its content hash so context-token and cost
   claims can be independently recomputed.

Suggested artifact names use the form:

```text
<status>__<workload-id>__<arm>__top-k-<k-or-na>__rep-<n>__<span-id>.<ext>
```

The first real run should add a machine-readable manifest that hashes each raw
artifact and links it to the append-only execution trace.
