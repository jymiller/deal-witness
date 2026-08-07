# Bundle 2 — Economics and Credit

> **SYNTHETIC DEMO CORPUS.** Project Asterline, Asterline Gateway, every organization, person, role, place, date, event, record, quote, amount, and deal term below are invented and do not resemble a real airport or transaction.

- **Bundle ID:** `bundle-02-economics-credit`
- **Coverage:** `2027-02-05T09:00:00.000Z`–`2027-04-30T17:00:00.000Z`
- **Records:** 96 (`22 email`, `10 meeting_record`, `8 call_summary`, `40 financial_model_note`, `4 counsel_markup`, `8 approval_memo`, `4 financing_draft`)
- **Ingestion mode:** `preloaded_replay`
- **Fixture state:** preload-ready deterministic metadata
- **Replay counter:** `72 → 168` from fixture metadata

## What the bundle establishes

These historical records cover the fictional $380 million facility, sources and uses, construction draws, cost buffers, interest mechanics, completion support, and the credit team's evolving decisions. Maya's retained provenance connects model cells to the meetings and approvals that explain them; a number without its decision trail is not treated as an answer.

## Representative fixture record

**`source-0073` — Financial model note 0073 — `2027-02-05T09:00:00.000Z`**

Lena Voss authors the note with Maya Soren participating across Asterline Infrastructure Holdings and Harbor Glass Private Credit. Its fixture metadata records Maya's role as `noticed`.

The note can connect Money to Decisions but cannot prove a release condition by itself: `can_confirm=false`, `can_block=false`, and `support_role=context_or_initial_report`.

## Replay cue

The fixture-derived presentation counter reaches 168. Money and Decisions grow denser, provenance fills in, and several apparent duplicates merge into supported atomic items instead of creating extra map nodes. Replay uses preload-ready fixture metadata and performs no live writes.
