#!/usr/bin/env python3
"""Initialize and verify the dedicated Deal Witness EverOS memory space.

The probe is deliberately tiny and wholly synthetic. It verifies that one
multi-participant session produces separately attributable memory before the
larger demo corpus is loaded. The API key is read only from the environment or
the repository's ignored ``.env`` file and is never printed.
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
PROJECT_ID = "synthetic-airport-space-bootstrap-v1"
SESSION_ID = "deal-witness-team-collaboration-bootstrap-v1"
PROBE_MARKER = "DW_TEAM_COLLABORATION_BOOTSTRAP_V1"
SYNTHETIC_PREFIX = f"{PROBE_MARKER} | WHOLLY SYNTHETIC DEAL WITNESS EVIDENCE"

ENGINEER_ID = "person:elena-park-synthetic"
COUNSEL_ID = "person:priya-shah-synthetic"
PARTICIPANT_IDS = (ENGINEER_ID, COUNSEL_ID)


def message(
    sender_id: str,
    sender_name: str,
    timestamp: int,
    content: str,
) -> dict[str, Any]:
    return {
        "sender_id": sender_id,
        "sender_name": sender_name,
        "role": "user",
        "timestamp": timestamp,
        "content": f"{SYNTHETIC_PREFIX}\n{content}",
    }


PROBE_MESSAGES: tuple[dict[str, Any], ...] = (
    message(
        ENGINEER_ID,
        "Elena Park (synthetic)",
        1_786_121_000_000,
        "I am the independent engineer for the invented Aster Bay runway financing. "
        "I can provide and sign technical certification evidence, but I cannot "
        "approve lender credit or interpret the financing agreement.",
    ),
    message(
        COUNSEL_ID,
        "Priya Shah (synthetic)",
        1_786_121_001_000,
        "I am lender counsel for this wholly invented transaction. I own the "
        "drafting trail and can show where an approved condition belongs, but I "
        "cannot issue the engineer's certification.",
    ),
    message(
        ENGINEER_ID,
        "Elena Park (synthetic)",
        1_786_121_002_000,
        "For a certification gap, ask me for the technical evidence and certificate "
        "identifier. Ask the lender's credit director—not me—for approval authority.",
    ),
    message(
        COUNSEL_ID,
        "Priya Shah (synthetic)",
        1_786_121_003_000,
        "For a drafting gap, ask me for the source markup and target schedule. "
        "Technical evidence remains Elena's responsibility, so those roles must stay "
        "separately attributed.",
    ),
)


def response_field(response: Any, name: str, default: Any = None) -> Any:
    data = getattr(response, "data", response)
    if isinstance(data, dict):
        return data.get(name, default)
    return getattr(data, name, default)


def episode_count(client: EverOS, participant_id: str) -> int:
    response = client.get(
        "episode",
        user_id=participant_id,
        page=1,
        page_size=20,
    )
    episodes = response_field(response, "episodes", []) or []
    return len(episodes)


def inspect_participants(client: EverOS) -> dict[str, int]:
    return {
        participant_id: episode_count(client, participant_id)
        for participant_id in PARTICIPANT_IDS
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--write",
        action="store_true",
        help="write and flush the four-message synthetic collaboration probe",
    )
    parser.add_argument("--wait-seconds", type=int, default=45)
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
                        "mode": "preview_only",
                        "app_id": APP_ID,
                        "project_id": PROJECT_ID,
                        "session_id": SESSION_ID,
                        "message_count": len(PROBE_MESSAGES),
                        "participant_count": len(PARTICIPANT_IDS),
                    },
                    indent=2,
                )
            )
            return 0

        added = client.add(
            session_id=SESSION_ID,
            messages=list(PROBE_MESSAGES),
            mode="chat",
            async_mode=False,
        )
        flushed = client.flush(SESSION_ID)

        deadline = time.monotonic() + max(0, args.wait_seconds)
        participant_episodes = inspect_participants(client)
        while (
            not all(participant_episodes.values())
            and time.monotonic() < deadline
        ):
            time.sleep(2)
            participant_episodes = inspect_participants(client)

        separately_attributed = all(participant_episodes.values())
        print(
            json.dumps(
                {
                    "ok": separately_attributed,
                    "mode": "write_and_verify",
                    "app_id": APP_ID,
                    "project_id": PROJECT_ID,
                    "session_id": SESSION_ID,
                    "message_count": response_field(
                        added, "message_count", len(PROBE_MESSAGES)
                    ),
                    "add_status": response_field(added, "status", "unknown"),
                    "flush_status": response_field(flushed, "status", "unknown"),
                    "participant_episode_counts": participant_episodes,
                    "separately_attributed": separately_attributed,
                },
                indent=2,
            )
        )
        return 0 if separately_attributed else 1
    except Exception as exc:  # never print provider details that may contain secrets
        print(json.dumps({"ok": False, "error_type": type(exc).__name__}))
        return 1
    finally:
        client.close()


if __name__ == "__main__":
    sys.exit(main())
