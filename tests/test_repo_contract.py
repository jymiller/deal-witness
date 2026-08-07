import json
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EVENT_KEY = "snowflake-beta-fund-agent-token-economy-2026-08-07"
TRACE_ID = "3809f8742fbf2961916b9a5bbbd9a21c"
SYNTHETIC = "PRERUN · SYNTHETIC"


def load_json(relative_path: str):
    return json.loads((ROOT / relative_path).read_text(encoding="utf-8"))


def test_event_contract_keeps_non_negotiable_build_and_memory_boundaries():
    event = load_json(".hackathon/event.json")

    assert event["event_key"] == EVENT_KEY
    assert event["trace_id"] == TRACE_ID
    assert event["project"]["name"] == "Memory Knee"
    assert event["project"]["data_status"] == SYNTHETIC

    assert event["build"]["builder"] == "Codex"
    assert event["build"]["codex_exclusive"] is True
    assert event["build"]["snowflake_cortex"]["status"] == "on_hold_excluded"
    assert event["build"]["snowflake_cortex"]["included_in_build"] is False

    assert event["memory"]["preparation"]["provider"] == "Cognee"
    assert event["memory"]["preparation"]["shipped_product_dependency"] is False
    product_memory = event["memory"]["product"]
    assert product_memory["provider"] == "EverMind / EverOS"
    assert product_memory["system"] == "Memory OS"
    assert product_memory["required"] is True
    assert product_memory["role"] == "load-bearing benchmark arm"
    assert product_memory["integration_status"] == "required_for_valid_result"
    assert (
        product_memory["adapter_status"]
        == "credential_client_connected_real_benchmark_pending"
    )
    assert product_memory["api_contract_status"] == "official_v2_wire_contract_confirmed"
    assert product_memory["cloud_base_url"] == "https://api.evermind.ai"
    assert (
        product_memory["official_reference_url"]
        == "https://docs.evermind.ai/llms-full.txt"
    )
    assert product_memory["official_python_sdk"] == {
        "package": "everos-cloud",
        "version": "1.0.0",
    }
    assert product_memory["confirmed_v2_operations"] == ["add", "flush", "search"]
    assert product_memory["confirmed_v2_paths"] == {
        "add": "/api/v2/memory/add",
        "flush": "/api/v2/memory/flush",
        "search": "/api/v2/memory/search",
    }
    assert product_memory["credentials_status"] == "authenticated_v2_search_probe"
    assert product_memory["credential_env_var"] == "EVEROS_API_KEY"
    assert product_memory["credential_committed"] is False


def test_submission_contract_has_required_fields_and_deadline_order():
    submission = load_json(".hackathon/event.json")["submission"]

    assert set(submission["required_fields"]) == {
        "team_name",
        "project_name",
        "members",
        "slide_deck_url",
    }
    assert submission["values"]["project_name"] == "Memory Knee"
    assert submission["values"]["team_name"] is None
    assert submission["values"]["slide_deck_url"] is None
    assert set(submission["values"]["members"]["required_member_fields"]) == {
        "name",
        "email",
        "role",
    }
    assert submission["live_demo_required"] is False

    freeze = datetime.fromisoformat(submission["internal_freeze_at"])
    deadline = datetime.fromisoformat(submission["hard_deadline_at"])
    assert freeze < deadline
    assert deadline.hour == 16


def test_trace_is_valid_append_only_jsonl_with_initial_span_types():
    lines = (ROOT / ".hackathon/trace.jsonl").read_text(encoding="utf-8").splitlines()
    entries = [json.loads(line) for line in lines if line.strip()]

    assert {"repo", "handoff", "tactic"}.issubset({entry["kind"] for entry in entries})
    assert all(entry["event_key"] == EVENT_KEY for entry in entries)
    assert all(entry["trace_id"] == TRACE_ID for entry in entries)
    assert len({entry["span_id"] for entry in entries}) == len(entries)
    assert all(len(entry["span_id"]) == 16 for entry in entries)
    assert all(datetime.fromisoformat(entry["timestamp"]).utcoffset() is not None for entry in entries)


def test_workload_is_planned_synthetic_input_without_results():
    workload = load_json("data/workload.json")

    assert workload["data_status"] == SYNTHETIC
    assert workload["results"] == {
        "full_history": [],
        "evermind_top_k": [],
        "recommendation": None,
    }
    assert workload["execution_plan"]["result_status_before_execution"] == "not_run"
    assert workload["preservation_gates"]["configuration_not_result"] is True
    assert workload["benchmark_axis"] == "evermind_search_top_k"
    assert workload["evermind_arm"]["required_for_valid_result"] is True
    assert workload["evermind_arm"]["confirmed_operations"] == ["add", "flush", "search"]
    assert (
        workload["evermind_arm"]["credentials_status"]
        == "authenticated_v2_search_probe"
    )
    assert (
        workload["evermind_arm"]["wire_contract_status"]
        == "official_v2_wire_contract_confirmed"
    )
    assert workload["evermind_arm"]["real_benchmark_status"] == "not_run"

    candidates = workload["candidate_top_k"]
    assert candidates == sorted(set(candidates))
    assert all(candidate > 0 for candidate in candidates)
    assert workload["workloads"]
    assert all(item["data_status"] == SYNTHETIC for item in workload["workloads"])
    assert all(item["contains_personal_data"] is False for item in workload["workloads"])


def test_contract_documentation_scaffold_exists():
    required_paths = [
        "README.md",
        ".hackathon/evidence/README.md",
        ".hackathon/evals/capability/README.md",
        ".hackathon/evals/regression/README.md",
    ]
    assert all((ROOT / path).is_file() for path in required_paths)


def test_local_secret_contract_keeps_real_credential_out_of_repository():
    gitignore = (ROOT / ".gitignore").read_text(encoding="utf-8").splitlines()
    env_example = (ROOT / ".env.example").read_text(encoding="utf-8")

    assert ".env" in gitignore
    assert ".env.*" in gitignore
    assert "!.env.example" in gitignore
    assert "EVEROS_API_KEY=" in env_example
    assert [
        line for line in env_example.splitlines() if line.startswith("EVEROS_API_KEY=")
    ] == ["EVEROS_API_KEY="]
