# Deal Witness — Product Contract (Canonical Draft v1)

> Synthetic demo only. All names, entities, events, and deal terms are invented and are not modeled on any actual company, transaction, or person.

## One sentence

Deal Witness turns scattered deal conversations and documents into a small, source-backed map that catches when a remembered promise is missing from the closing contract.

## User

The deal teammate taking over Maya's work and deciding whether a synthetic $24 million loan can keep moving toward its Friday close.

## Value

- Preserve the reasoning behind a deal when its lead becomes unavailable.
- Show one concept becoming better supported—**HEARD → CONFIRMED → IN CONTRACT**—instead of making duplicate facts look like progress.
- Trace every conclusion to a short, human-readable source.
- Stop a closing review when a required, well-supported promise is absent from the current draft.

## Canonical demo behavior

The core map contains 12 stable concepts in four fixed, plain-English regions: **Money, Promises, Risks, Decisions**. A covenant is described as **“a promise that protects the money.”** The critical promise is always displayed as: **“Owners cannot take cash out of the business without lender permission.”**

`READY` means only that the evidence loaded so far has no unresolved demo blocker; it is not legal approval or authority to close. When closing draft v7 is checked, its missing critical promise changes the status from `READY` to `HOLD FOR REVIEW`. Corrected draft v8 contains the promise, repairs the broken connection, and returns the status to `READY`.

## Non-goals

- Give legal advice, judge enforceability, or replace counsel or a human reviewer.
- Automatically approve, close, sign, or edit a loan.
- Replace a CRM, data room, underwriting system, or document-management system.
- Treat a larger source count as stronger evidence without a qualifying confirmation.
- Model every deal detail or make architecture and integration choices in this story contract.
- Use real deal data, real-company lookalikes, or non-synthetic evidence.

## Acceptance criteria

1. The opening establishes that the fictional $24 million loan closes Friday and Maya leaves tomorrow.
2. The core map has exactly 12 stable concept IDs and only the four user-facing regions **Money, Promises, Risks, Decisions**.
3. The critical promise appears verbatim as **“Owners cannot take cash out of the business without lender permission.”**
4. Any use of *covenant* is immediately explained as **“a promise that protects the money.”**
5. The evidence pack contains a negotiation call, internal message, approved deal memo, Maya's exit answer, and closing draft; the closing-draft artifact has omitted v7 and corrected v8 versions.
6. Every concept exposes its sources, verification state, and current-draft match state. `CONFIRMED` means better-supported memory, not legal correctness; `IN CONTRACT` means present in the checked draft, not enforceable.
7. The call first marks the critical promise `HEARD`. The approved memo confirms the same concept. Additional sources attach to that concept rather than creating duplicate nodes.
8. In v7, the critical promise remains `CONFIRMED`, its contract match is `MISSING`, and its connection to the draft is visibly broken and labeled **Remembered, but missing from draft**.
9. The v7 mismatch is the sole blocker and changes `READY` to `HOLD FOR REVIEW`, with links to the remembered sources and the checked draft.
10. In v8, the critical promise becomes `IN CONTRACT`, its contract match is `MATCHED`, the connection is repaired, and the status returns to `READY`.
11. The map never uses source volume as a confidence score; state changes require an approved source, explicit human confirmation, or a direct result from checking the current draft. Only a match can advance a concept to `IN CONTRACT`.
12. The scripted story finishes in three minutes, is understandable without legal or finance expertise, uses only synthetic facts, and matches the validated JSON fixture.
