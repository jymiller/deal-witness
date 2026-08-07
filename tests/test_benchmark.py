from __future__ import annotations

import json
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
from unittest.mock import patch


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from cost_knee import (  # noqa: E402
    DEFAULT_EVIDENCE_LABEL,
    BatchResponse,
    ReturnedItem,
    SweepConfig,
    SweepContext,
    SyntheticAdapter,
    TEST_EVIDENCE_LABEL,
    WorkItem,
    run_batch_size_sweep,
    run_sweep,
)
from cost_knee.cli import main as cli_main  # noqa: E402
from cost_knee.everos import (  # noqa: E402
    EverOSConnectionStatus,
    EverOSCredentialLoadError,
    MissingEverOSCredentialError,
)


class BrokenAdapter:
    name = "broken-fixture"
    evidence_kind = "test"

    def run_batch(self, items, context: SweepContext) -> BatchResponse:
        self.last_context = context
        return BatchResponse(
            items=(
                ReturnedItem("b", 2),
                ReturnedItem("b", 999),
                ReturnedItem("c", 999),
                ReturnedItem("unexpected", 4),
            ),
            cost=1.5,
            latency_ms=12.0,
            cost_unit="credits",
        )


class BenchmarkTests(unittest.TestCase):
    def setUp(self) -> None:
        self.workload = [
            WorkItem("a", 1),
            WorkItem("b", 2),
            WorkItem("c", 3),
        ]

    def test_accounts_for_each_failure_dimension_independently(self) -> None:
        artifact = run_sweep(
            self.workload,
            BrokenAdapter(),
            SweepConfig(
                values=(7,),
                parameter="retrieval_budget",
                items_per_call=3,
                quality_floor=0.9,
                evidence_label=TEST_EVIDENCE_LABEL,
            ),
        )
        result = artifact.results[0]
        payload = result.to_dict()

        self.assertEqual(payload["requested"], {"count": 3, "ids": ["a", "b", "c"]})
        self.assertEqual(payload["returned"]["count"], 4)
        self.assertEqual(payload["correctness"]["correct"], 1)
        self.assertEqual(payload["correctness"]["incorrect"], 1)
        self.assertEqual(payload["dropped"], {"count": 1, "ids": ["a"]})
        self.assertEqual(payload["duplicates"], {"count": 1, "ids": ["b"]})
        self.assertEqual(payload["unexpected"], {"count": 1, "ids": ["unexpected"]})
        self.assertEqual(payload["misalignment"]["count"], 1)
        self.assertEqual(payload["cost"]["total"], 1.5)
        self.assertEqual(payload["cost"]["per_item"], 0.5)
        self.assertEqual(payload["latency"]["total_ms"], 12.0)
        self.assertFalse(payload["passed_quality_floor"])

    def test_synthetic_batch_sweep_selects_cheapest_pass_and_first_failure(self) -> None:
        workload = [WorkItem(f"item-{index}", index) for index in range(8)]
        artifact = run_batch_size_sweep(
            workload,
            SyntheticAdapter(fail_at=4),
            batch_sizes=(1, 2, 4, 8),
            quality_floor=0.95,
        )
        payload = artifact.to_dict()

        self.assertEqual(payload["label"], DEFAULT_EVIDENCE_LABEL)
        self.assertEqual(payload["evidence"]["claim_status"], "preflight_only")
        self.assertEqual(payload["selection"]["knee"]["batch_size"], 2)
        self.assertEqual(payload["selection"]["first_failing_size"], 4)
        failed = payload["results"][2]
        self.assertGreater(failed["dropped"]["count"], 0)
        self.assertGreater(failed["duplicates"]["count"], 0)
        self.assertGreater(failed["misalignment"]["count"], 0)
        self.assertLess(failed["correctness"]["rate"], 1.0)

    def test_test_adapter_accepts_only_the_test_evidence_label(self) -> None:
        artifact = run_sweep(
            self.workload,
            BrokenAdapter(),
            SweepConfig(
                values=(1,),
                quality_floor=0,
                evidence_label=TEST_EVIDENCE_LABEL,
            ),
        )
        payload = artifact.to_dict()
        self.assertEqual(payload["label"], TEST_EVIDENCE_LABEL)
        self.assertEqual(payload["evidence"]["claim_status"], "test_only")

        with self.assertRaisesRegex(ValueError, "test adapters require"):
            run_sweep(
                self.workload,
                BrokenAdapter(),
                SweepConfig(values=(1,), quality_floor=0),
            )

    def test_synthetic_adapter_rejects_measured_evidence_labels(self) -> None:
        with self.assertRaisesRegex(ValueError, "synthetic adapters require"):
            run_sweep(
                self.workload,
                SyntheticAdapter(),
                SweepConfig(
                    values=(1,),
                    quality_floor=0,
                    evidence_label=TEST_EVIDENCE_LABEL,
                ),
            )

    def test_generic_adapter_receives_parameter_and_value(self) -> None:
        adapter = BrokenAdapter()
        run_sweep(
            self.workload,
            adapter,
            SweepConfig(
                values=(12,),
                parameter="top_k",
                items_per_call=3,
                quality_floor=0,
                evidence_label=TEST_EVIDENCE_LABEL,
            ),
        )
        self.assertEqual(adapter.last_context.parameter, "top_k")
        self.assertEqual(adapter.last_context.value, 12)

    def test_cli_writes_default_artifact_path_shape(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            workload_path = root / "data" / "workload.json"
            output_path = root / "artifacts" / "latest.json"
            workload_path.parent.mkdir(parents=True)
            workload_path.write_text(
                json.dumps(
                    {
                        "items": [
                            {"id": f"item-{index}", "expected": index}
                            for index in range(4)
                        ]
                    }
                ),
                encoding="utf-8",
            )

            exit_code = cli_main(
                [
                    "--workload",
                    str(workload_path),
                    "--output",
                    str(output_path),
                    "--batch-sizes",
                    "1,2,4",
                    "--fail-at",
                    "4",
                ]
            )

            self.assertEqual(exit_code, 0)
            payload = json.loads(output_path.read_text(encoding="utf-8"))
            self.assertEqual(payload["label"], DEFAULT_EVIDENCE_LABEL)
            self.assertEqual(payload["selection"]["first_failing_size"], 4)

    def test_cli_consumes_memory_knee_plan_schema(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            workload_path = root / "data" / "workload.json"
            output_path = root / "artifacts" / "latest.json"
            workload_path.parent.mkdir(parents=True)
            workload_path.write_text(
                json.dumps(
                    {
                        "benchmark_axis": "evermind_search_top_k",
                        "candidate_top_k": [1, 2, 4],
                        "preservation_gates": {
                            "minimum_recall_relative_to_full_history": 1.0
                        },
                        "workloads": [
                            {
                                "id": "recall-case",
                                "scenario": "synthetic preflight",
                                "ground_truth_fields": ["entity_id"],
                            }
                        ],
                        "results": {
                            "full_history": [],
                            "evermind_top_k": [],
                            "recommendation": None,
                        },
                    }
                ),
                encoding="utf-8",
            )

            exit_code = cli_main(
                [
                    "--workload",
                    str(workload_path),
                    "--output",
                    str(output_path),
                    "--fail-at",
                    "4",
                ]
            )

            self.assertEqual(exit_code, 0)
            payload = json.loads(output_path.read_text(encoding="utf-8"))
            self.assertEqual(payload["configuration"]["sweep_values"], [1, 2, 4])
            self.assertEqual(
                payload["configuration"]["sweep_parameter"],
                "evermind_search_top_k",
            )
            self.assertEqual(payload["configuration"]["quality_floor"], 1.0)
            self.assertEqual(payload["selection"]["first_failing_value"], 4)

    def test_cli_checks_everos_without_printing_the_credential(self) -> None:
        sentinel = "everos-cli-secret-DO-NOT-EXPOSE"

        class FakeClient:
            def __init__(self) -> None:
                self.closed = False

            def close(self) -> None:
                self.closed = True

        client = FakeClient()
        output = StringIO()
        with (
            patch("cost_knee.cli.create_everos_client", return_value=client),
            patch(
                "cost_knee.cli.probe_everos_connection",
                return_value=EverOSConnectionStatus(True, "connected"),
            ),
            redirect_stdout(output),
        ):
            exit_code = cli_main(["--check-everos"])

        self.assertEqual(exit_code, 0)
        self.assertTrue(client.closed)
        self.assertEqual(json.loads(output.getvalue())["code"], "connected")
        self.assertNotIn(sentinel, output.getvalue())

    def test_cli_reports_missing_everos_credential_without_exception_details(self) -> None:
        sentinel = "everos-cli-secret-DO-NOT-EXPOSE"
        output = StringIO()
        with (
            patch(
                "cost_knee.cli.create_everos_client",
                side_effect=MissingEverOSCredentialError(),
            ),
            redirect_stdout(output),
        ):
            exit_code = cli_main(["--check-everos"])

        payload = json.loads(output.getvalue())
        self.assertEqual(exit_code, 2)
        self.assertEqual(payload["code"], "missing_credential")
        self.assertFalse(payload["connected"])
        self.assertNotIn(sentinel, output.getvalue())

    def test_cli_distinguishes_redacted_credential_load_failures(self) -> None:
        sentinel = "everos-load-secret-DO-NOT-EXPOSE"
        output = StringIO()
        with (
            patch(
                "cost_knee.cli.create_everos_client",
                side_effect=EverOSCredentialLoadError(),
            ),
            redirect_stdout(output),
        ):
            exit_code = cli_main(["--check-everos"])

        payload = json.loads(output.getvalue())
        self.assertEqual(exit_code, 2)
        self.assertEqual(payload["code"], "credential_load_failed")
        self.assertFalse(payload["connected"])
        self.assertNotIn(sentinel, output.getvalue())

    def test_cli_redacts_client_close_failures(self) -> None:
        sentinel = "everos-close-secret-DO-NOT-EXPOSE"

        class FailingCloseClient:
            def close(self) -> None:
                raise RuntimeError(f"close leaked {sentinel}")

        output = StringIO()
        with (
            patch(
                "cost_knee.cli.create_everos_client",
                return_value=FailingCloseClient(),
            ),
            patch(
                "cost_knee.cli.probe_everos_connection",
                return_value=EverOSConnectionStatus(True, "connected"),
            ),
            redirect_stdout(output),
        ):
            exit_code = cli_main(["--check-everos"])

        payload = json.loads(output.getvalue())
        self.assertEqual(exit_code, 3)
        self.assertEqual(payload["code"], "client_close_failed")
        self.assertFalse(payload["connected"])
        self.assertNotIn(sentinel, output.getvalue())

    def test_rejects_duplicate_workload_ids(self) -> None:
        with self.assertRaisesRegex(ValueError, "workload IDs must be unique"):
            run_batch_size_sweep(
                [WorkItem("same", 1), WorkItem("same", 2)],
                SyntheticAdapter(),
                batch_sizes=(1,),
                quality_floor=0.9,
            )


if __name__ == "__main__":
    unittest.main()
