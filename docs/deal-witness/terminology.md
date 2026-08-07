# Deal Witness — Plain-Language Terminology

> **Wholly synthetic demo.** This guide controls user-facing copy for Project Asterline. It is not legal, credit, engineering, or construction guidance.

| Avoid or explain | Use in the product |
|---|---|
| Private credit | **A loan arranged by non-bank lenders** |
| Facility | **The total financing available** |
| Sponsor | **The organization responsible for funding and delivering the project** |
| Lender | **A team providing the money** |
| Draw / advance | **A release of loan money** |
| First construction draw | **The first release of loan money for construction** |
| Sources and uses | **Where the money comes from and where it will go** |
| Liquidity | **Money available when it is needed** |
| Covenant | **A promise that protects the money** |
| Condition precedent | **Something that must happen before the money moves** |
| Noise-mitigation budget | **Money set aside to address runway-noise impacts** |
| Independent engineer | **A third-party technical reviewer** |
| Certification | **The technical reviewer's attributable written confirmation** |
| Fully funded | **All required money has been deposited and is available** |
| Definitive document / execution draft | **Financing draft** |
| Contract-scoped item | **A remembered term expected in the checked contract** |
| Material omission / discrepancy | **A required, supported term missing from the checked draft** |
| Knowledge graph | **Deal map** |
| Ingestion visualization | **Evidence River** |
| Node | **Atomic item** for one decision, commitment, risk, or question; **cluster** for its map summary |
| Edge | **Connection** |
| Provenance | **Where we learned it** or **source link** |
| Knowledge gap | **Hollow item** or **open question** |
| Candidate-expert ranking | **Who Knows What** |
| Ranking explanation | **Why this person?** |
| Evidence-grounded question | **A question that shows what prompted it and links to relevant sources** |
| Vague answer | **A reply that does not identify enough evidence to close the question** |
| Receipt | **The attributable record of who answered, when, from which organization, and with which source** |
| Investigation recipe | **The reusable trail from gap to candidate ranking, question, evidence, answer, and state change** |
| Contract match | **Whether the checked draft includes the expected term** |
| Escalation / readiness gate | **Hold for review** |
| Primary / critical / hero dependency | **Selected example** when describing the demonstrated omission |

## Who Knows What fields

These fields are independent evidence-backed distinctions, not one confidence score:

- `likely_knows` — historical evidence suggests the person may understand the topic; it does not authorize or verify an answer.
- `can_provide_evidence` — the person can supply or point to a source that can be cited.
- `can_certify` — the person's role permits the relevant technical certification.
- `authorized_to_confirm` — the person can formally confirm a fact within the scope of their role.
- `authorized_to_approve` — the person can make, accept, waive, or change the relevant approval decision.

**Why this person?** must cite the records and relationship edges behind each field. Maya may appear there only as historical provenance; she is never an available candidate.

## State language

- **HEARD** — captured from an initial source and not yet confirmed. More mentions alone do not change this state.
- **CONFIRMED** — supported by a substantive authorized human answer and attributable evidence, or by an approved internal record; not a legal, technical, or factual judgment by Deal Witness.
- **MISSING** — the memory remains supported, but direct comparison did not find the expected term in the current checked draft.
- **IN CONTRACT** — direct comparison found the expected term in the current checked draft; not a judgment about enforceability, completeness, or sufficiency.
- **NOT REQUIRED** — contextual knowledge that is not expected to appear in the financing contract.
- **READY** — no unresolved displayed blocker exists in the loaded evidence; not permission to sign, close, fund, or release money.
- **HOLD FOR REVIEW** — a required, supported term is missing from the checked draft, so a person must review it.

## Outreach and transcript language

- Say **“prepared simulated call”**, never “live call.” The demo performs no dialing, calendar action, meeting creation, or messaging.
- A vague answer such as **“The budget is covered”** remains open. Likelihood, seniority, repetition, and relationship strength cannot confirm it.
- Synchronize each prepared transcript line with its provenance chips and receipt. If audio is unavailable or muted, the silent transcript uses the same sequence and timed highlights.
- The product stores the answer, attribution, timestamps, receipts, citations, candidate-ranking reasons, and investigation recipe in EverOS. Label `source-0430` as a **prepared demo capture**, not a claim of an unshown live write.
- Maya departed before recovery began. Never address a question to her or attribute a post-departure answer, referral, or action to her; show her only on historical provenance and relationship edges.

## Runtime and source boundaries

- **Runtime observation** means a separate inference-only read of 20 messages, 10 episodes, and 5 profiles under supplied IDs. It may indicate concepts emerging at runtime but is not fixture truth, deal-source truth, or confirmation evidence.
- Never predeclare runtime concept labels. Render them only after the observation returns them, and do not let them alter corpus totals, map states, contract matches, or readiness.
- Say **“replay from stored, preload-ready fixture metadata”** for the 430-record Evidence River. Do not claim those records are already bulk-loaded into a live EverOS space. Only v7 and v8 are staged live; do not imply 432 live writes.
- A higher source count is not stronger proof by itself. Keep citations visible and explain which authorized answer or approved record changed the state.
- A quiet background external signal may prompt a question only. It cannot confirm memory, create a Promise, block review, or change readiness.
- `selected_for_demo` means **chosen to inspect on screen**. It is presentation metadata, not a risk rank, centrality score, or claim of unique importance.

## Canonical demonstrated-term copy

Show the selected example exactly as written below:

> Before lenders release the first construction draw, the sponsor must deposit the noise-mitigation budget and an independent engineer must certify it is fully funded.

When space is constrained, shorten labels around the term, not the term itself. Keep the full sentence in the detail view, hold reason, and direct draft comparison.
