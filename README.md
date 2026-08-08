# Deal Witness

> **Great people leave. The deal should still remember.**

Deal Witness is a high-value-person recovery system for complex transactions. It turns months of institution-owned conversations and documents into a cited map of what was decided, what could go wrong, what was promised, and how the money is affected. When a key person leaves, the team can find gaps, identify who should know, ask a grounded question, preserve the answer, and check that the final paper matches the recovered memory.

This hackathon demo is **wholly synthetic**. Every person, company, source, date, quote, amount, and project detail is invented.

## Open the public build

**[Launch Deal Witness on Render →](https://deal-witness.onrender.com/)**

[How the two views work](https://deal-witness.onrender.com/guide.html) · [Growth Map](https://deal-witness.onrender.com/) · [Recovery Explorer](https://deal-witness.onrender.com/explorer.html) · [Hackathon notes](https://deal-witness.onrender.com/about.html) · [Presentation deck](https://deal-witness.onrender.com/assets/deal-witness-hackathon-deck.pdf)

## The hackathon build

Deal Witness was built on August 7, 2026 for an EverMind / EverOS memory hackathon. The one-day build asked a simple question: **when a great person leaves, can the institution preserve the evidence paths, relationships, and investigation habits that made their judgment useful?**

This public repository is the post-hackathon record of that experiment. The hosted product is an interactive, deterministic replay over a wholly synthetic transaction; it does not claim live enterprise connectors, autonomous outreach, or a browser-to-EverOS write. The load-bearing EverOS adapter and dedicated-memory-space probe remain server-side development paths so no credential is exposed in the public site.

The five-page [`Deal Witness` presentation deck](frontend/assets/deal-witness-hackathon-deck.pdf) is stored directly in the repository so it remains available without a separate Drive share.

## The story

Project Asterline is a synthetic **$380 million private-credit runway and infrastructure financing** assembled across nine months by 14 organizations and 36 people.

Maya Soren was the trusted analytical hub across those teams. She knew where decisions came from, how risks connected, who held the evidence, and who had authority. Maya leaves on Friday. On Monday, the deal team inherits the transaction—and the financing is scheduled to close that Friday.

Deal Witness does not clone Maya or pretend to replace her judgment. It preserves the institution-owned evidence and relationship paths the team needs after she is gone.

## How the Deal Map grows

Evidence enters from familiar enterprise channels and becomes a causal map with four vertical slices:

```text
Teams · Slack · WhatsApp · Email · SharePoint · models · documents
                              │
                              ▼
        DECISIONS ──▶ RISKS ──▶ PROMISES ──▶ MONEY
                         │            │           │
                    what could    mitigation   financial
                    go wrong      agreed       consequence
```

One source can create or update a decision. That decision can branch into several risks; negotiated mitigations become promises—often called covenants—and those promises govern when and how money can move. As more evidence arrives, the visual compresses hundreds of underlying items into a legible, growing map while keeping every source link available for inspection.

The deterministic corpus contains:

- 432 source records across 12 synthetic channel types
- 288 atomic items and 576 typed relationships
- 864 provenance links back to supporting evidence
- 144 contract-scoped items summarized into 13 visible clusters
- 24 investigation paths, including complete and deliberately open paths

See the [product contract](docs/deal-witness/product-contract.md), [three-minute demo script](docs/deal-witness/demo-script.md), and [plain-language terminology](docs/deal-witness/terminology.md).

## The active recovery loop

Deal Witness is not a passive archive. The demo shows the system being used after Maya has already left:

1. The growing Deal Map exposes a hollow, unsupported path.
2. Deal Witness shows the conflicting or missing receipts behind the gap.
3. **Who Knows What** reconstructs likely experts from historical authorship, attendance, referrals, approvals, and workstream ownership.
4. **Why this person?** explains whether each candidate likely knows, can provide evidence, can certify, or is authorized to approve.
5. The product prepares an evidence-grounded question for a visibly simulated outreach—no real call or message is sent.
6. A vague answer stays open. A substantive answer with source receipts can advance the memory.
7. EverOS stores the attributed answer, citations, and reusable investigation recipe.
8. The recovered path is reused to compare financing draft v7 with corrected v8: `READY → HOLD FOR REVIEW → READY`.

The demonstrated omission is one representative item among 144 contract-scoped items, not a single “hero fact.” `READY` means no blocker is present in the loaded demo evidence; it is not legal approval or authority to close or release money.

## Why EverOS

**EverMind / EverOS is the product's load-bearing memory layer.** The application uses the official `everos-cloud==1.0.0` client and the v2 `add`, `flush`, and `search` path. The API key is resolved only at runtime from the process environment or the ignored local `.env` file; it is never logged or committed.

The dedicated EverOS Memory Space is named **Deal Witness**. The bounded bootstrap probe writes four synthetic messages, flushes them, and verifies that memories remain separately attributable to two participants.

The 430-record Evidence River is currently a deterministic replay from preload-ready fixture metadata, not a claim that 430 records have already been bulk-loaded into EverOS. The v7/v8 draft sequence is staged separately. Runtime observations are labeled inference-only and cannot change fixture truth, contract matches, or readiness.

Cognee was used only as preparation memory during the build. It is not a shipped product dependency. Snowflake/Cortex and Voice Cursor are out of scope.

## Run it

Requirements: Python 3.11+ and Node.js.

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -e '.[test]'
```

Run the test suite and validate every generated corpus invariant:

```bash
.venv/bin/python -m pytest -q
node data/deal-witness/validate-corpus.mjs
```

Run the presentation locally:

```bash
python3 -m http.server 8000 --directory frontend
```

Open `http://localhost:8000` for the spacious animated vertical-lane story. The deeper receipt and recovery-loop explorer remains available at `http://localhost:8000/explorer.html`.

## Present it from Google Slides

The repository includes three slide-ready exports of the approved memory-growth sequence:

- [`artifacts/deal-witness-memory-growth-demo.mp4`](artifacts/deal-witness-memory-growth-demo.mp4) — 22-second, 1920×1080 H.264 video for the clearest projected playback
- [`artifacts/deal-witness-memory-growth-preview.gif`](artifacts/deal-witness-memory-growth-preview.gif) — 22-second, 1280×720 looping GIF for a no-click animated slide
- [`artifacts/deal-witness-memory-growth-poster.png`](artifacts/deal-witness-memory-growth-poster.png) — still-image fallback

For the MP4, upload the file to Google Drive, wait for Drive to finish processing it, then use **Insert → Video → Google Drive** in Slides and enable autoplay in the video playback options. For the GIF, use **Insert → Image**; it loops automatically during slideshow playback. The exports contain no browser chrome and show the deterministic sequence from sparse memory through document reinforcement to the representative hollow path.

The longer [`artifacts/deal-witness-demo.mp4`](artifacts/deal-witness-demo.mp4) is an older explorer-based recovery walkthrough preserved for development reference. Use `deal-witness-memory-growth-demo.mp4` for the current presentation UI. The older capture remains reproducible with [`scripts/capture-deal-witness-demo.mjs`](scripts/capture-deal-witness-demo.mjs).

The corpus validator checks 22,544 assertions and verifies that all 15 generated outputs reproduce byte-for-byte. To regenerate the synthetic corpus before validating it:

```bash
node data/deal-witness/generate-corpus.mjs
node data/deal-witness/validate-corpus.mjs
```

## Connect a dedicated EverOS space

Create a local secret file from the blank template. Never commit the result.

```bash
(umask 077 && cp -n .env.example .env)
chmod 600 .env
```

Add a key that belongs to the dedicated **Deal Witness** Memory Space, then run the non-mutating connectivity check:

```bash
.venv/bin/cost-knee --check-everos
```

Preview the bounded collaboration probe without writing memory:

```bash
.venv/bin/python scripts/verify_deal_witness_space.py
```

After confirming the key is bound to the intended space, explicitly write and verify the four-message synthetic probe:

```bash
.venv/bin/python scripts/verify_deal_witness_space.py --write
```

The scripts never print the credential or raw provider responses that might contain it. The wire contract follows the [official EverOS API reference](https://docs.evermind.ai/llms-full.txt).

## Evidence boundaries

- No Enid repository, requirements, identifiers, customer information, or other sensitive Enid material is copied into this codebase. Enid remains strictly read-only.
- Teams, Slack, WhatsApp, Email, SharePoint, model, and document labels represent synthetic source types in the replay. This repository does not claim live connectors to those systems.
- Every demo artifact is synthetic and must remain visibly labeled as such.
- A relationship or repeated statement can suggest whom to ask; it cannot independently confirm a fact.
- Deal Witness provides cited memory and review support, not legal, credit, or engineering advice.

## Repository guide

- [`data/deal-witness/corpus/`](data/deal-witness/corpus/) — generated source records, items, relationships, provenance, expert ranking, replay frames, and draft matches
- [`data/deal-witness/evidence/`](data/deal-witness/evidence/) — seven readable evidence bundles used in the story
- [`data/deal-witness/expected-state.json`](data/deal-witness/expected-state.json) — deterministic snapshots and display contract
- [`frontend/index.html`](frontend/index.html) — presentation-first animated vertical-lane experience
- [`frontend/guide.html`](frontend/guide.html) — plain-language explainer connecting the Growth Map and Recovery Explorer
- [`frontend/explorer.html`](frontend/explorer.html) — detailed fixture-driven investigation and paper-check view
- [`src/cost_knee/everos.py`](src/cost_knee/everos.py) — secret-safe EverOS client construction and connectivity probe
- [`scripts/verify_deal_witness_space.py`](scripts/verify_deal_witness_space.py) — dedicated-space collaboration probe
- [`tests/`](tests/) — repository, EverOS, corpus-support, and benchmark tests
- [`.hackathon/event.json`](.hackathon/event.json) and [`.hackathon/trace.jsonl`](.hackathon/trace.jsonl) — canonical event contract and append-only build trace

## Status

The synthetic corpus, invariants, story contract, EverOS adapter, dedicated-space probe, and deterministic recovery sequence are implemented. The build remains honest about which events are fixture replay, prepared simulation, and live EverOS interaction.
