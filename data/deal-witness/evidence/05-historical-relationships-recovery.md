# Bundle 5 — Historical Relationship Memory and Post-Departure Expert Recovery

> **SYNTHETIC DEMO CORPUS.** Project Asterline, Asterline Gateway, every organization, person, role, place, date, event, record, quote, amount, interface action, and deal term below are invented and do not resemble a real airport or transaction.

- **Bundle ID:** `bundle-05-historical-relationships-recovery`
- **Coverage:** `2027-02-18T09:00:00.000Z`–`2027-09-08T16:45:00.000Z`
- **Records:** 78 (`20 email`, `8 meeting_record`, `6 call_summary`, `21 counsel_markup`, `6 construction_update`, `8 approval_memo`, `4 inspection_record`, `5 financing_draft`)
- **Ingestion mode:** `preloaded_replay`
- **Fixture state:** preload-ready deterministic metadata
- **Maya's status:** departed at `2027-09-03T17:00:00.000Z`; unavailable when recovery starts
- **Recovery start:** `2027-09-06T09:00:00.000Z`
- **Recovery completion:** `2027-09-08T16:45:00.000Z`
- **Target close:** `2027-09-10T10:00:00.000Z`
- **Presentation counter:** `352 → 430`, derived from fixture replay order

The 78-record count is deterministic corpus truth. The records are preload-ready; this pack does not assert that a bulk load or provider persistence has occurred. Any EverOS observation count shown at runtime is inference-only diagnostic data and must not be used to prove corpus cardinality.

## What the bundle proves

Maya Soren appears only in historical provenance and relationship edges created during her years on the deal. There is no exit interview, last-minute handoff, new question to Maya, or claim that she completed this investigation before leaving. On Monday the remaining team must recover the path without her.

The first four bundles preserve what Maya historically noticed and connected. This bundle combines that relationship memory with a post-departure recovery loop:

1. `source-0425` exposes a hollow gap.
2. `source-0424` and `source-0425` support historical evidence and relationship search.
3. **Who Knows What** ranks candidates and explains “Why this person.”
4. `source-0427` prepares a citation-grounded simulated question to Ada Rook.
5. `source-0426` preserves Ada's first vague answer as unresolved.
6. `source-0428` supplies Ada's sourced technical answer; `source-0429` supplies Ren Ito's approved internal record.
7. `source-0430` is the preload-ready memory-completion capture record for `investigation-path-001`.
8. The completed trail supports Thursday's v7 and v8 comparisons; human reviewers retain authority over Friday's close.

## Capability boundaries

| Capability | What it does here | What it does not do |
|---|---|---|
| **Deal Map** | Compresses evidence into the four fixed regions: Money, Promises, Risks, Decisions. | Does not add a people or relationship region. |
| **Who Knows What** | Ranks people from fixture authorship, attendance, approval ownership, and historical relationship edges; “Why this person” shows citations. | Is not a fifth map region and cannot confirm a Promise or create a blocker. |
| **Prepared outreach** | Replays a deterministic synthetic transcript from fixture records. | Places no real call, creates no calendar event, opens no meeting platform, and sends no message. |
| **Silent fallback** | Shows the same prepared question, responses, states, and citations as text with no audio. | Does not change evidence quality or skip the vague-answer check. |
| **Evidence capture** | Defines the attributed answer, receipts, source links, and recovery recipe to retain. | Does not prove the payload has been persisted to a provider or promote weak context without a confirming source. |
| **Draft comparison** | Tests supported contract-scoped items against the selected draft. | Does not make legal judgments or authorize closing. |

The source channel labels describe deterministic fixture artifacts. Even when a record is labeled `email` or `meeting_record`, the prepared demo sequence performs no live interaction.

## Prepared recovery transcript

This display follows the seven canonical fixture records `source-0424` through `source-0430`. It is not a live conversation or a new source record. The silent fallback renders the identical prepared text and citations.

### 1. Historical routing receipt

**`source-0424` — `2027-08-27T15:00:00.000Z` — approval memo**

Historical institution-owned relationship memory shows that Maya repeatedly worked with Ada Rook on independent-engineer evidence and Ren Ito on approved credit conditions. This is routing evidence only: `can_confirm=false`, `can_block=false`, `support_role=historical_routing_evidence`.

### 2. Monday: fixture evidence exposes the gap

**`source-0425` — `2027-09-06T09:00:00.000Z` — call summary**

With Maya already gone, the evidence connects noise mitigation to first-draw readiness but does not reveal the controlling condition, certifier, or approval receipt.

- **Support state:** `HEARD`
- **Gap status:** `OPEN`
- **can_confirm:** `false`
- **Effect:** `heard_gap`; confirms no Promise

### 3. Historical search ranks the likely owners

**`investigation-path-001` — search at `09:10Z`; ranking at `09:20Z`**

1. **Ada Rook — director, Clearspan Independent Engineering**
   **Why this person:** Ada's historical technical authorship in `source-0169`, the relationship receipt `source-0424`, and the gap record `source-0425` connect her to the certification path before outreach begins. She can provide, confirm, and certify engineering evidence but cannot approve the lender condition.
2. **Ren Ito — credit committee chair, Harbor Glass Private Credit**
   **Why this person:** Ren's historical participation in approval record `source-0356` and the relationship receipt `source-0424` connect him to approved credit conditions before recovery begins. He can confirm and approve the lender record but cannot issue the engineering certificate.
3. **Talia Wren — project-controls lead, Asterline Runway Company**
   **Why this person:** `source-0425` connects Talia to draw-coordination context, but the receipts show no authority to provide evidence, confirm, approve, or certify the term.

The ranking uses institution-owned historical evidence, including relationships Maya helped establish before leaving. It does not contact or query Maya. Rank positions are deterministic fixture output, not EverOS runtime-observation counts.

### 4. Prepared question and unresolved vague answer

**`source-0427` — `2027-09-06T09:30:00.000Z` — meeting record / prepared simulated interaction**

**Prepared question to Ada Rook:** “The stored receipts connect noise mitigation to first draw but do not show the approved funding and certification condition. Ada, what must be funded and certified before release, and which source controls?”

**`source-0426` — `2027-09-06T09:45:00.000Z` — email / prepared reply**

**Ada Rook:** “The budget is covered.”

- **prepared_interaction:** `true`
- **live_outreach:** `false`
- **can_confirm:** `false`
- **Resolution effect:** `NONE`
- **Gap status after response:** `OPEN`
- **Why:** no funding schedule, approved release condition, certification receipt, or citation

No external communication occurs. The transcript and provenance panel are prepared fixture content and can run silently.

### 5. Tuesday: Ada provides the sourced technical answer

**`source-0428` — `2027-09-07T14:00:00.000Z` — meeting record**

Ada cites the independent-engineer certification package and confirms that the certificate must show the sponsor's noise-mitigation budget is fully funded before first draw.

- **can_confirm:** `true`
- **can_block:** `false`
- **authority_level:** `expert_confirmation`
- **support_role:** `substantive_human_confirmation`
- **Attribution:** Ada Rook / Clearspan Independent Engineering
- **Effect:** substantive technical confirmation; lender approval still required

### 6. Wednesday: the team retrieves Ren's approved record

**`source-0429` — occurred `2027-08-31T16:20:00.000Z`; retrieved `2027-09-08T10:00:00.000Z` — approval memo**

**Ren Ito, Harbor Glass credit committee chair and approved-record owner:**

> Before lenders release the first construction draw, the sponsor must deposit the noise-mitigation budget and an independent engineer must certify it is fully funded.

- **can_confirm:** `true`
- **can_block:** `false`
- **authority_level:** `approved_internal`
- **support_role:** `approved_internal_record`

Ada's substantive answer and the retrieved approved receipt close the hollow gap and move the atomic item from `HEARD` to `CONFIRMED`.

### 7. Wednesday: preload-ready capture payload completes the fixture path

**`source-0430` — `2027-09-08T16:45:00.000Z` — meeting record**
**Investigation path:** `investigation-path-001`

The fixture record titled **EverOS post-departure memory-completion capture** defines the payload to retain:

- the grounded question and candidate ranking with “Why this person” evidence;
- the vague answer marked `unresolved / cannot confirm`;
- Ada Rook's substantive answer and attribution;
- Ren Ito's approved answer and receipt;
- timestamps and source links `source-0424` through `source-0430`;
- synchronized prepared transcript citations and silent fallback; and
- the reusable recipe: expose the gap → search historical evidence and relationships → rank source-backed experts → ask a grounded question → reject a vague answer → require substantive and approved receipts → preserve citations → compare the next draft.

`source-0430` remains `stored_state=preload_ready`, `prepared_interaction=true`, and `live_outreach=false`. It is the canonical capture fixture, not evidence that provider persistence or bulk loading has occurred. Runtime observations remain inference-only diagnostics.

## Demonstration metadata

- **selected_for_demo:** `true`
- **required_for_release:** `true`
- **central_to_transaction:** `false`
- **highest_risk:** `false`
- **uniquely_important:** `false`
- **importance_rank:** `none`

## Replay cue

The fixture-derived presentation counter reaches 430. Historical relationship edges populate Who Knows What beside—not inside—the four-region map, the vague answer stays visibly open, and sourced support strengthens the existing Promise cluster. Replay performs no live writes; runtime EverOS observations are inference-only and are not corpus truth.
