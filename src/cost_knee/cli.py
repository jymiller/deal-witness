"""Command-line entry point for preflight and secure EverOS connectivity."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Sequence

from .benchmark import SyntheticAdapter, load_workload, run_sweep
from .everos import (
    EverOSClientCreationError,
    EverOSCredentialError,
    EverOSCredentialLoadError,
    create_everos_client,
    probe_everos_connection,
)
from .models import SweepConfig


def _positive_int(value: str) -> int:
    parsed = int(value)
    if parsed <= 0:
        raise argparse.ArgumentTypeError("must be a positive integer")
    return parsed


def _unit_interval(value: str) -> float:
    parsed = float(value)
    if not 0 <= parsed <= 1:
        raise argparse.ArgumentTypeError("must be between 0 and 1")
    return parsed


def _sweep_values(value: str) -> tuple[int, ...]:
    try:
        values = tuple(int(part.strip()) for part in value.split(",") if part.strip())
    except ValueError as error:
        raise argparse.ArgumentTypeError("must be comma-separated integers") from error
    if not values or any(item <= 0 for item in values):
        raise argparse.ArgumentTypeError("must contain positive integers")
    if any(left >= right for left, right in zip(values, values[1:])):
        raise argparse.ArgumentTypeError("values must be unique and strictly increasing")
    return values


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="cost-knee",
        description=(
            "Generate a labeled synthetic preflight artifact or securely verify "
            "EverOS v2 connectivity."
        ),
    )
    parser.add_argument("--workload", type=Path, default=Path("data/workload.json"))
    parser.add_argument("--output", type=Path, default=Path("artifacts/latest.json"))
    parser.add_argument(
        "--sweep-parameter",
        default=None,
        help="defaults to benchmark_axis in the workload, then batch_size",
    )
    parser.add_argument(
        "--sweep-values",
        "--batch-sizes",
        dest="sweep_values",
        type=_sweep_values,
        default=None,
        help="comma-separated, strictly increasing positive integers",
    )
    parser.add_argument(
        "--quality-floor",
        type=_unit_interval,
        default=None,
        help="defaults to the workload preservation gate, then 0.95",
    )
    parser.add_argument("--fail-at", type=_positive_int, default=8)
    parser.add_argument(
        "--items-per-call",
        type=_positive_int,
        default=None,
        help="optional fixed chunk size for non-batch sweep parameters",
    )
    parser.add_argument(
        "--check-everos",
        action="store_true",
        help="authenticate with a non-mutating EverOS v2 search and exit",
    )
    parser.add_argument(
        "--env-file",
        type=Path,
        default=None,
        help="optional dotenv path for --check-everos (defaults to repository .env)",
    )
    return parser


def _check_everos_connection(env_file: Path | None) -> int:
    try:
        client = create_everos_client(dotenv_path=env_file)
    except EverOSCredentialLoadError:
        print(
            json.dumps(
                {
                    "api_version": "v2",
                    "code": "credential_load_failed",
                    "connected": False,
                    "operation": "search",
                    "provider": "everos-cloud",
                },
                sort_keys=True,
            )
        )
        return 2
    except EverOSCredentialError:
        print(
            json.dumps(
                {
                    "api_version": "v2",
                    "code": "missing_credential",
                    "connected": False,
                    "operation": "search",
                    "provider": "everos-cloud",
                },
                sort_keys=True,
            )
        )
        return 2
    except EverOSClientCreationError:
        print(
            json.dumps(
                {
                    "api_version": "v2",
                    "code": "client_creation_failed",
                    "connected": False,
                    "operation": "search",
                    "provider": "everos-cloud",
                },
                sort_keys=True,
            )
        )
        return 2

    close_failed = False
    try:
        status = probe_everos_connection(client)
    finally:
        close = getattr(client, "close", None)
        if callable(close):
            try:
                close()
            except Exception:
                close_failed = True

    if close_failed:
        print(
            json.dumps(
                {
                    "api_version": "v2",
                    "code": "client_close_failed",
                    "connected": False,
                    "operation": "search",
                    "provider": "everos-cloud",
                },
                sort_keys=True,
            )
        )
        return 3

    print(json.dumps(status.to_dict(), sort_keys=True))
    return 0 if status.connected else 3


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.check_everos:
        return _check_everos_connection(args.env_file)

    source_document = json.loads(args.workload.read_text(encoding="utf-8"))
    workload = load_workload(args.workload)
    sweep_values = args.sweep_values
    if sweep_values is None and isinstance(source_document, dict):
        candidates = source_document.get("candidate_top_k")
        if candidates is not None:
            sweep_values = tuple(candidates)
    if sweep_values is None:
        sweep_values = (1, 2, 4, 8, 16)

    sweep_parameter = args.sweep_parameter
    if sweep_parameter is None and isinstance(source_document, dict):
        sweep_parameter = source_document.get("benchmark_axis")
    if not sweep_parameter:
        sweep_parameter = "batch_size"

    quality_floor = args.quality_floor
    if quality_floor is None and isinstance(source_document, dict):
        gates = source_document.get("preservation_gates", {})
        if isinstance(gates, dict):
            quality_floor = gates.get("minimum_recall_relative_to_full_history")
    if quality_floor is None:
        quality_floor = 0.95

    config = SweepConfig(
        values=sweep_values,
        quality_floor=quality_floor,
        parameter=sweep_parameter,
        items_per_call=args.items_per_call,
    )
    artifact = run_sweep(workload, SyntheticAdapter(fail_at=args.fail_at), config)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(artifact.to_dict(), indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote synthetic preflight artifact: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
