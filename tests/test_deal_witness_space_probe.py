from __future__ import annotations

import importlib.util
from pathlib import Path
from types import ModuleType


def load_probe_module() -> ModuleType:
    path = Path(__file__).parents[1] / "scripts" / "verify_deal_witness_space.py"
    spec = importlib.util.spec_from_file_location("deal_witness_space_probe", path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_probe_is_tiny_synthetic_and_multi_participant() -> None:
    probe = load_probe_module()

    assert probe.APP_ID == "deal-witness"
    assert probe.PROJECT_ID == "synthetic-airport-space-bootstrap-v1"
    assert len(probe.PROBE_MESSAGES) == 4
    assert len(probe.PARTICIPANT_IDS) == 2
    assert {message["sender_id"] for message in probe.PROBE_MESSAGES} == set(
        probe.PARTICIPANT_IDS
    )
    assert all(
        message["content"].startswith(probe.SYNTHETIC_PREFIX)
        for message in probe.PROBE_MESSAGES
    )
    assert all(
        "maya" not in message["sender_id"].lower()
        for message in probe.PROBE_MESSAGES
    )


def test_probe_preserves_distinct_authority_boundaries() -> None:
    probe = load_probe_module()
    text = "\n".join(message["content"] for message in probe.PROBE_MESSAGES)

    assert "cannot approve lender credit" in text
    assert "cannot issue the engineer's certification" in text
    assert "roles must stay separately attributed" in text
