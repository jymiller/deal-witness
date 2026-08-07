from __future__ import annotations

import importlib.util
from pathlib import Path
from types import ModuleType


def load_seed_module() -> ModuleType:
    path = Path(__file__).parents[1] / "scripts" / "seed_deal_witness_discovery.py"
    spec = importlib.util.spec_from_file_location("deal_witness_discovery_seed", path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_seed_is_small_synthetic_and_post_departure() -> None:
    seed = load_seed_module()

    assert seed.APP_ID == "deal-witness"
    assert seed.PROJECT_ID == "synthetic-airport-discovery-v1"
    assert [len(messages) for _, messages in seed.SESSIONS] == [8, 8, 4]
    assert all(
        message["content"].startswith(seed.SYNTHETIC_PREFIX)
        for _, messages in seed.SESSIONS
        for message in messages
    )

    post_departure_messages = [
        message for _, messages in seed.SESSIONS[1:] for message in messages
    ]
    assert all(message["sender_id"] != seed.MAYA_ID for message in post_departure_messages)
    post_departure_text = "\n".join(message["content"] for message in post_departure_messages)
    assert "Maya is not available to answer" in post_departure_text
    assert "Prepared question for Elena" in post_departure_text
    assert "response A captured, gap remains open" in post_departure_text
    assert "Friday, August 7, 2026" in post_departure_text


def test_contact_roles_remain_distinct() -> None:
    seed = load_seed_module()
    text = "\n".join(
        message["content"] for _, messages in seed.SESSIONS for message in messages
    )

    assert "likely knows the technical status and can provide evidence" in text
    assert "not authorized to approve lender credit" in text
    assert "authorized to confirm any change to the lender condition" in text
    assert "historical relationship edge" in text
