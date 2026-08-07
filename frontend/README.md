# Deal Witness visual prototype

This directory is a dependency-free, fixture-driven presenter prototype. It shows a closed memory-completion loop for a wholly synthetic airport-infrastructure financing:

    INGEST → MAP → EXPOSE → IDENTIFY → ASK → CAPTURE → UPDATE → USE

Maya is already gone in the canonical story. She appears only in historical provenance edges. The active recovery flow ranks and contacts a non-Maya synthetic expert through an explicitly labeled prepared simulation.

The static page does not call EverOS, place a call, send a message, or make a live write. EverOS remains the load-bearing integration target.

## Run locally

From the repository root:

    python3 -m http.server 8000 --directory frontend

Open http://localhost:8000. HTTP serving is required because the browser loads the local fixture with fetch(). There is no install or build step.

Run the checks with:

    node --check frontend/app.js
    node --test frontend/tests/*.test.mjs

## Presenter controls

- **Previous**, **Next**, the numbered track, ←, →, Home, and End step through the same deterministic state machine.
- **Play** or Space runs the 2:48 replay. **Replay** or R starts again.
- **Play prepared call** uses browser-local speech synthesis only after a user gesture. **Mute** and **Skip audio** always leave the authoritative transcript and receipts visible.
- Audio support is optional. The silent fallback is the complete on-screen transcript; audio never determines memory state.

Autoplay pauses when the page becomes hidden. Reduced-motion preferences remove nonessential animation.

## Truthful replay

- 430 evidence records are represented as already-stored metadata.
- draft_v7 and draft_v8 are the only two staged_live records.
- The Monday–Wednesday post-departure completion interaction is a replay of preloaded metadata, not a live call or network write.
- The local fixture names the current EverOS seed integration target: app deal-witness, project synthetic-airport-discovery-v1, 3 sessions, 10 episodes, and 5 profiles.

## deal-witness.v2 fixture contract

The page fetches the URL in data-fixture-url on the root HTML element. The current fixture is fixtures/deal-witness.json.

| Field | Backend responsibility |
| --- | --- |
| river | Global scale and truth labels: months, organizations, people/roles, stored versus staged records, atomic items, provenance, typed relationships, cluster count, contract scope, and bounded sample tokens. |
| regions[] | Exactly four fixed regions in this order: Money, Promises, Risks, Decisions. |
| clusters[] | 12–14 stable clusters. Each supplies fixed region/slot, fixture copy, aggregate metrics, density, and one bounded representative example. |
| sources[] | 2–7 visible bundles with record counts, stored/staged counts, 1–12 representative evidence items, and clusterDeltas[] tied to a representative receipt. Staged-only draft bundles may supply an empty delta array. |
| sources[].evidence[] | Display-safe evidence metadata, stakeholder, origin, load mode, governance (canConfirm, canBlock), claims, and optional historicalRelationship. |
| historicalNavigator | Departed human attribution, recorded deadline, historical role, and explicit boundary. It is not an active contact contract. |
| knowledgeDirectory | Three to six ranked non-Maya contacts with role, organization, subject areas, prepared channel, capability, rationale, and approved receipt IDs. |
| completionLoop | Bounded stages, 3–12 authoritative transcript entries, vague/substantive semantics, prepared-simulation copy, stored receipt, and investigation recipe. |
| drafts[] | Draft evidence identity plus representative links. A missing expected link creates a verified mismatch; a later child revision reconnects it. |
| presentation.steps[] | Fixture-owned story copy, evidence cutoff, selected example, knowledge state, draft, decision, and duration. |
| story.weekStakes | Fixture-owned weekday/deadline strip and its accessible label. |
| memoryLayer | Display-safe integration target metadata only. Never put API keys or credentials here. |

Per-cluster aggregate fields required from the backend are:

    atomicCount
    sourceCount
    provenanceCount
    relationshipCount
    contractScopedCount
    densityPercent

Each bundle must also provide:

    recordCount
    preloadedCount
    stagedLiveCount
    clusterDeltas[] {
      clusterId
      evidenceId
      atomicCount
      sourceCount
      provenanceCount
      relationshipCount
      contractScopedCount
    }

The browser derives visual state:

    no revealed claim                      → hidden
    one revealed heard claim               → heard / hollow
    approved confirm claim                 → confirmed / solid
    checked draft links the example        → written / contract-linked
    confirmed + expected + no draft link   → missing / broken at paper edge

External synthetic reporting is restricted to Risks, heard, canConfirm: false, and canBlock: false. It cannot close the selected gap or enter the document-hold trace.

## Bounded rendering and scale ceiling

The DOM is intentionally independent of aggregate volume:

- at most 14 cluster cards;
- at most 7 source-bundle cards;
- at most 12 representative evidence rows in the current bundle;
- at most 18 Evidence River tokens;
- at most 6 ranked contacts;
- at most 12 transcript entries;
- no DOM node per atomic item, evidence record, provenance link, or typed relationship.

Aggregate and record counts are validated as non-negative JavaScript safe integers and formatted compactly. The schema ceiling is 9,007,199,254,740,991 for any individual count; performance remains bounded because count magnitude only changes text. Browser QA covers the canonical 432 records / 288 atomic items / 864 provenance links / 576 relationships. The contract test also checks compact formatting at the safe-integer ceiling.

## Integration handoff

Replace the local fixture URL with a same-origin endpoint that returns the same deal-witness.v2 shape. The backend should translate EverOS records into display-safe aggregates and bounded representative receipts. The frontend must never receive EVEROS_API_KEY or any other secret.

The document decision must be derived only from:

1. an approved, confirming, blocking-capable evidence trail for the demonstrated example; and
2. the checked draft revision.

Historical Maya edges can rank candidates but cannot answer the question, close the gap, approve language, or change readiness. A vague selected-expert response also leaves the example heard.

## Cost of swapping the story

For any replacement that stays inside the validated bounds and v2 contract, the exact implementation cost is:

- replace **one file**: frontend/fixtures/deal-witness.json;
- change **zero** HTML, CSS, or JavaScript files;
- rerun the fixture test and browser QA.

New evidence kinds fall back to their fixture-provided text label, so source vocabulary can change without controller work.
