#!/usr/bin/env python3
"""Seed and inspect a small, wholly synthetic Deal Witness EverOS experiment.

The seed intentionally contains source-like conversations rather than predefined
Deal Map clusters. EverOS gets the first chance to extract episodes and atomic
facts; the application can decide how to visualize those results afterward.

The API key is resolved only from the process environment or the repository's
git-ignored ``.env`` file. It is never logged or serialized.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from everos_cloud import EverOS


APP_ID = "deal-witness"
PROJECT_ID = "synthetic-airport-discovery-v1"
SEED_MARKER = "DW_DISCOVERY_V1"
SYNTHETIC_PREFIX = f"{SEED_MARKER} | WHOLLY SYNTHETIC DEAL WITNESS EVIDENCE"

WORKSPACE_OWNER = "deal-witness-synthetic-workspace"
MAYA_ID = "person:maya-ortiz-synthetic"
ELENA_ID = "person:elena-park-synthetic"
PRIYA_ID = "person:priya-shah-synthetic"
TALIA_ID = "person:talia-morgan-synthetic"
MARCUS_ID = "person:marcus-reed-synthetic"
JONAH_ID = "person:jonah-lee-synthetic"

OWNER_IDS = (
    WORKSPACE_OWNER,
    MAYA_ID,
    ELENA_ID,
    PRIYA_ID,
    TALIA_ID,
    MARCUS_ID,
    JONAH_ID,
)


def message(
    sender_id: str,
    sender_name: str,
    role: str,
    timestamp: int,
    content: str,
) -> dict[str, Any]:
    return {
        "sender_id": sender_id,
        "sender_name": sender_name,
        "role": role,
        "timestamp": timestamp,
        "content": f"{SYNTHETIC_PREFIX}\n{content}",
    }


SESSIONS: tuple[tuple[str, tuple[dict[str, Any], ...]], ...] = (
    (
        "deal-witness-discovery-v1-foundation",
        (
            message(
                WORKSPACE_OWNER,
                "Deal Witness synthetic workspace",
                "user",
                1_785_513_600_000,
                "Source type: approved deal overview recorded before Maya's legitimate departure. Aster Bay Runway Renewal is a wholly invented $420 million private-credit construction financing assembled over nine months. The transaction involves a synthetic airport sponsor, private-credit lenders, counsel, engineers, contractors, environmental advisers, and local authorities. Maya is gone on Monday, August 3, 2026; the deal is scheduled to close Friday, August 7, 2026. Great people naturally grow and leave. The organizational risk is allowing the understanding they helped create to disappear with them. This record is institution-owned and is not a real transaction.",
            ),
            message(
                MAYA_ID,
                "Maya Ortiz (synthetic)",
                "user",
                1_785_513_601_000,
                "Source ID: meeting-014. I am the deal integration lead at Atlas Bridge Partners. I have worked with this group for years. I do not personally approve credit, certify engineering, or give legal advice. My role is to connect what people decided, where the evidence lives, and who has authority. Prepared contact channel: in-app request contact:maya-ortiz.",
            ),
            message(
                TALIA_ID,
                "Talia Morgan (synthetic)",
                "user",
                1_785_513_602_000,
                "Source ID: credit-committee-031. I am credit director at Crestline Private Credit. I am authorized to approve lender credit conditions, but I cannot certify engineering completion. The approved first-draw condition requires sponsor-funded noise protections to be fully funded and independently certified before lenders release construction proceeds. Prepared contact channel: contact:talia-morgan.",
            ),
            message(
                MARCUS_ID,
                "Marcus Reed (synthetic)",
                "user",
                1_785_513_603_000,
                "Source ID: sponsor-model-022. I am CFO of Northstar Infrastructure Holdings, the synthetic sponsor. The model earmarks $18.6 million of sponsor equity for noise-protection work before the first construction draw. I can provide funding evidence but cannot approve the lender condition or certify the engineering scope. Prepared contact channel: contact:marcus-reed.",
            ),
            message(
                ELENA_ID,
                "Elena Park (synthetic)",
                "user",
                1_785_513_604_000,
                "Source ID: engineering-review-047. I am the independent engineer at Meridian Technical Review. I own the technical verification workstream and can provide evidence and issue the independent certification. I cannot approve lender credit or interpret the financing agreement. Prepared contact channel: contact:elena-park.",
            ),
            message(
                PRIYA_ID,
                "Priya Shah (synthetic)",
                "user",
                1_785_513_605_000,
                "Source ID: counsel-markup-063. I am lender counsel at Harborline Legal. I own the drafting workstream and can show where an approved commercial requirement appears in the financing papers. I am not the engineering certifier and do not independently approve credit. Prepared contact channel: contact:priya-shah.",
            ),
            message(
                JONAH_ID,
                "Jonah Lee (synthetic)",
                "user",
                1_785_513_606_000,
                "Source ID: construction-update-088. I direct construction for Horizon Airfield Constructors. I know the installation schedule, contractor scope, and completion evidence. Elena Park independently verifies our work; Talia Morgan owns lender approval. Prepared contact channel: contact:jonah-lee.",
            ),
            message(
                MAYA_ID,
                "Maya Ortiz (synthetic)",
                "user",
                1_785_513_607_000,
                "Source ID: relationship-map-009. For questions about the noise-protection draw condition: Marcus likely knows the funding status and can provide the sponsor ledger; Jonah likely knows construction status; Elena can provide and sign the independent technical evidence; Priya can provide the drafting trail; Talia is authorized to confirm or change the lender approval. Those are different kinds of knowing and must not be collapsed.",
            ),
        ),
    ),
    (
        "deal-witness-discovery-v1-gap-resolution",
        (
            message(
                WORKSPACE_OWNER,
                "Deal Witness synthetic workspace",
                "assistant",
                1_785_772_800_000,
                "Monday, August 3, 2026. Maya Ortiz is gone and her access has ended. The $420 million financing is scheduled to close Friday. Gap ID: gap-first-draw-certifier. The sponsor model earmarks funding and the credit record requires independent certification, but the loaded receipts do not yet identify the exact certifier, required evidence package, or drafting location. Why it matters: releasing the first draw without a verified condition would contradict the approved credit record. Candidate contacts must be reconstructed and ranked from historical source receipts; Maya is not available to answer.",
            ),
            message(
                WORKSPACE_OWNER,
                "Deal Witness synthetic workspace",
                "assistant",
                1_785_772_801_000,
                "Who-knows-what ranking reconstructed after Maya's departure: Elena Park ranks first because she authored engineering-review-047, owns the technical verification workstream, and Maya's historical relationship-map-009 named her as the person able to provide and sign the certification. Elena likely knows the technical status and can provide evidence; she is not authorized to approve lender credit. Priya Shah ranks next for drafting evidence, and Talia Morgan for approval authority. Prepared question for Elena, grounded in sponsor-model-022, credit-committee-031, engineering-review-047, and relationship-map-009: What exact evidence must exist before you issue the independent certification, and what identifier should counsel place in the first-draw schedule? No external message was sent; this is a deterministic in-app simulated outreach.",
            ),
            message(
                ELENA_ID,
                "Elena Park (synthetic)",
                "user",
                1_785_772_802_000,
                "Prepared response A: The engineering team has it. This response is intentionally vague. It does not identify the evidence, certificate, authority boundary, or document location and must not close the gap.",
            ),
            message(
                WORKSPACE_OWNER,
                "Deal Witness synthetic workspace",
                "assistant",
                1_785_772_803_000,
                "Quality gate result: response A captured, gap remains open. Missing: named source owner, approved or direct evidence, certifier authority, and target drafting location.",
            ),
            message(
                WORKSPACE_OWNER,
                "Deal Witness synthetic workspace",
                "assistant",
                1_785_772_804_000,
                "Prepared follow-up for Elena: engineering-review-047 shows that you own certification, while Maya's historical relationship-map-009 points to construction-plan-091 and july-review-104. Please identify the precise funding and contracting evidence, the certificate identifier, and the boundary between your certification and lender approval.",
            ),
            message(
                ELENA_ID,
                "Elena Park (synthetic)",
                "user",
                1_785_772_805_000,
                "Prepared source-backed response: I am the named independent engineer in engineering-review-047. Construction-plan-091 and july-review-104 show that the $18.6 million noise-protection budget must be deposited and the installation package placed under contract before I issue certificate IE-17. Certificate IE-17 is the evidence required before the first draw. I can provide and sign that evidence; I cannot approve lender credit.",
            ),
            message(
                PRIYA_ID,
                "Priya Shah (synthetic)",
                "user",
                1_785_772_806_000,
                "Prepared source-backed response: counsel-markup-063 instructs that the condition and certificate IE-17 appear in the first-draw conditions schedule. I can provide the drafting history. Talia Morgan remains the person authorized to confirm any change to the lender condition.",
            ),
            message(
                WORKSPACE_OWNER,
                "Deal Witness synthetic workspace",
                "assistant",
                1_785_772_807_000,
                "Memory completion receipt: gap-first-draw-certifier is now supported by engineering-review-047, construction-plan-091, july-review-104, certificate IE-17, and counsel-markup-063. Attribution is preserved to Maya only for the historical relationship edge, Elena for the current technical evidence and certification, Priya for drafting evidence, and Talia for approval authority. Investigation recipe learned: after a key person leaves, reconstruct candidates from authorship, attendance, referrals, approvals, and workstream ownership; then ask separately who likely knows the status, who can provide evidence, who can certify, who can approve, and where the requirement must be drafted.",
            ),
        ),
    ),
    (
        "deal-witness-discovery-v1-later-use",
        (
            message(
                PRIYA_ID,
                "Priya Shah (synthetic)",
                "user",
                1_786_118_400_000,
                "Friday, August 7, 2026. Source ID: financing-draft-v7. With Maya still unavailable and the financing scheduled to close today, draft v7 contains 143 of 144 synthetic contract-scoped items checked for the demonstration. It omits the first-draw reference to certificate IE-17. This is one representative omission among many interdependent commitments, not the singular essence of the deal.",
            ),
            message(
                WORKSPACE_OWNER,
                "Deal Witness synthetic workspace",
                "assistant",
                1_786_118_401_000,
                "Later memory use: Deal Witness retrieved the completed gap-first-draw-certifier path and its investigation recipe. The verified evidence says certificate IE-17 belongs in the first-draw conditions schedule, while financing-draft-v7 lacks it. Result: HOLD FOR REVIEW. The hold comes from verified internal evidence and direct document comparison, not source count or public sentiment.",
            ),
            message(
                PRIYA_ID,
                "Priya Shah (synthetic)",
                "user",
                1_786_118_402_000,
                "Source ID: financing-draft-v8. Corrected synthetic draft v8 adds the requirement that the sponsor deposit the noise-protection budget and deliver independent engineer certificate IE-17 before the first construction draw.",
            ),
            message(
                WORKSPACE_OWNER,
                "Deal Witness synthetic workspace",
                "assistant",
                1_786_118_403_000,
                "Later document check: the representative missing connection is now present in financing-draft-v8. Result: READY, meaning no blocker exists in the loaded synthetic evidence. READY is not legal approval or closing authority.",
            ),
        ),
    ),
)


def response_field(response: Any, name: str, default: Any = None) -> Any:
    data = getattr(response, "data", response)
    if isinstance(data, dict):
        return data.get(name, default)
    return getattr(data, name, default)


def items(response: Any, name: str) -> list[Any]:
    value = response_field(response, name, [])
    return list(value or [])


def safe_episode_view(episode: Any) -> dict[str, Any]:
    def value(name: str, default: Any = None) -> Any:
        if isinstance(episode, dict):
            return episode.get(name, default)
        return getattr(episode, name, default)

    facts = []
    for fact in value("atomic_facts", []) or []:
        if isinstance(fact, dict):
            facts.append(fact.get("content"))
        else:
            facts.append(getattr(fact, "content", str(fact)))
    return {
        "id": value("id"),
        "session_id": value("session_id"),
        "subject": value("subject"),
        "summary": value("summary"),
        "atomic_facts": [fact for fact in facts if fact],
    }


def inspect(client: EverOS) -> dict[str, Any]:
    owners: dict[str, Any] = {}
    total = 0
    for owner_id in OWNER_IDS:
        response = client.get(
            "episode",
            user_id=owner_id,
            page=1,
            page_size=100,
        )
        episodes = items(response, "episodes")
        total += len(episodes)
        owners[owner_id] = [safe_episode_view(episode) for episode in episodes]
    return {"episode_count": total, "owners": owners}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true", help="perform the synthetic cloud seed")
    parser.add_argument("--wait-seconds", type=int, default=30)
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    load_dotenv(repo_root / ".env", override=False)
    api_key = os.environ.get("EVEROS_API_KEY")
    if not api_key:
        print(json.dumps({"ok": False, "error": "EVEROS_API_KEY is not configured"}))
        return 2

    client = EverOS(
        api_key=api_key,
        app_id=APP_ID,
        project_id=PROJECT_ID,
        timeout=60.0,
    )
    try:
        if not args.write:
            print(
                json.dumps(
                    {
                        "ok": True,
                        "mode": "inspect_only",
                        "app_id": APP_ID,
                        "project_id": PROJECT_ID,
                        **inspect(client),
                    },
                    indent=2,
                )
            )
            return 0

        adds = []
        flushes = []
        for session_id, messages in SESSIONS:
            added = client.add(
                session_id=session_id,
                messages=messages,
                mode="chat",
                async_mode=False,
            )
            adds.append(
                {
                    "session_id": session_id,
                    "message_count": response_field(added, "message_count", len(messages)),
                    "status": response_field(added, "status", "unknown"),
                }
            )
            flushed = client.flush(session_id)
            flushes.append(
                {
                    "session_id": session_id,
                    "status": response_field(flushed, "status", "unknown"),
                }
            )

        deadline = time.monotonic() + max(0, args.wait_seconds)
        snapshot = inspect(client)
        while snapshot["episode_count"] == 0 and time.monotonic() < deadline:
            time.sleep(2)
            snapshot = inspect(client)

        searches = {}
        for owner_id in (WORKSPACE_OWNER, MAYA_ID, ELENA_ID):
            result = client.search(
                "Who knows about the first-draw certification gap, what evidence supports it, and how was that memory used later?",
                user_id=owner_id,
                method="hybrid",
                top_k=10,
                include_profile=False,
            )
            searches[owner_id] = [safe_episode_view(hit) for hit in items(result, "episodes")]

        print(
            json.dumps(
                {
                    "ok": True,
                    "mode": "write_and_verify",
                    "app_id": APP_ID,
                    "project_id": PROJECT_ID,
                    "seed_marker": SEED_MARKER,
                    "adds": adds,
                    "flushes": flushes,
                    **snapshot,
                    "searches": searches,
                },
                indent=2,
            )
        )
        return 0
    except Exception as exc:  # keep provider errors redacted
        print(json.dumps({"ok": False, "error_type": type(exc).__name__}))
        return 1
    finally:
        client.close()


if __name__ == "__main__":
    sys.exit(main())
