"""Sweep execution and the deterministic offline preflight adapter."""

from __future__ import annotations

import json
import math
from collections import Counter
from pathlib import Path
from time import perf_counter_ns
from typing import Any, Protocol, Sequence, runtime_checkable

from .models import (
    DEFAULT_EVIDENCE_LABEL,
    BatchResponse,
    BenchmarkArtifact,
    LIVE_EVIDENCE_LABEL,
    ReturnedItem,
    SweepConfig,
    SweepContext,
    SweepMetrics,
    TEST_EVIDENCE_LABEL,
    WorkItem,
)


@runtime_checkable
class BenchmarkAdapter(Protocol):
    """Minimal interface for local, memory-backed, or other adapters.

    Provider-specific integration belongs behind this boundary.  The benchmark
    itself performs no network or API operations.
    """

    name: str
    evidence_kind: str

    def run_batch(
        self,
        items: Sequence[WorkItem],
        context: SweepContext,
    ) -> BatchResponse:
        """Return normalized results and metering for one call."""


class SyntheticAdapter:
    """Deterministic, network-free preflight adapter.

    At and above ``fail_at`` it intentionally introduces a drop, duplicate,
    misalignment, and incorrect output whenever the batch has enough items.  A
    one-item call is made incorrect.  Its cost is expressed in synthetic units,
    never currency.
    """

    name = "deterministic-synthetic-preflight"
    evidence_kind = "synthetic"

    def __init__(
        self,
        fail_at: int = 8,
        *,
        base_call_cost: float = 0.002,
        per_item_cost: float = 0.0003,
        base_latency_ms: float = 4.0,
        per_item_latency_ms: float = 0.6,
    ) -> None:
        if fail_at <= 0:
            raise ValueError("fail_at must be positive")
        if min(base_call_cost, per_item_cost, base_latency_ms, per_item_latency_ms) < 0:
            raise ValueError("synthetic cost and latency terms must be non-negative")
        self.fail_at = fail_at
        self.base_call_cost = base_call_cost
        self.per_item_cost = per_item_cost
        self.base_latency_ms = base_latency_ms
        self.per_item_latency_ms = per_item_latency_ms

    def run_batch(
        self,
        items: Sequence[WorkItem],
        context: SweepContext,
    ) -> BatchResponse:
        returned = [ReturnedItem(item.id, item.expected) for item in items]
        if context.value >= self.fail_at and returned:
            if len(returned) == 1:
                only = returned[0]
                returned = [ReturnedItem(only.id, {"synthetic_mismatch": only.output})]
            else:
                shifted = returned[1:]
                first = shifted[0]
                shifted[0] = ReturnedItem(
                    first.id,
                    {"synthetic_mismatch": first.output},
                )
                shifted.append(ReturnedItem(first.id, first.output))
                returned = shifted

        return BatchResponse(
            items=tuple(returned),
            cost=self.base_call_cost + self.per_item_cost * len(items),
            latency_ms=self.base_latency_ms + self.per_item_latency_ms * len(items),
            cost_unit="synthetic_cost_units",
            metadata={"synthetic": True},
        )


def load_workload(path: str | Path) -> list[WorkItem]:
    """Load concrete items or the repository's planned Memory Knee workloads.

    Supported object keys are ``items`` for concrete evaluation cases and
    ``workloads`` for the preflight plan.  Planned workload entries do not yet
    contain answers, so their declared ``ground_truth_fields`` become the
    synthetic echo target.  This permits interface preflight without inventing
    any measured recall result.
    """

    source = Path(path)
    payload = json.loads(source.read_text(encoding="utf-8"))
    if isinstance(payload, dict):
        raw_items = payload.get("items")
        if raw_items is None:
            raw_items = payload.get("workloads")
    else:
        raw_items = payload
    if not isinstance(raw_items, list):
        raise ValueError(
            "workload JSON must be a list or an object with an 'items' or 'workloads' list"
        )

    items: list[WorkItem] = []
    for index, raw in enumerate(raw_items):
        if not isinstance(raw, dict):
            raise ValueError(f"workload item {index} must be an object")
        if "id" not in raw:
            raise ValueError(f"workload item {index} is missing 'id'")
        if "expected" in raw:
            expected = raw["expected"]
        elif "expected_output" in raw:
            expected = raw["expected_output"]
        elif "ground_truth_fields" in raw:
            expected = {"ground_truth_fields": raw["ground_truth_fields"]}
        else:
            raise ValueError(
                f"workload item {index} is missing 'expected' or 'ground_truth_fields'"
            )
        metadata = {
            key: value
            for key, value in raw.items()
            if key not in {"id", "expected", "expected_output"}
        }
        items.append(WorkItem(id=str(raw["id"]), expected=expected, metadata=metadata))
    _validate_workload(items)
    return items


def run_batch_size_sweep(
    workload: Sequence[WorkItem],
    adapter: BenchmarkAdapter,
    *,
    batch_sizes: Sequence[int],
    quality_floor: float,
    evidence_label: str = DEFAULT_EVIDENCE_LABEL,
) -> BenchmarkArtifact:
    """Convenience entry point for the original batch-size benchmark."""

    config = SweepConfig(
        values=tuple(batch_sizes),
        quality_floor=quality_floor,
        parameter="batch_size",
        evidence_label=evidence_label,
    )
    return run_sweep(workload, adapter, config)


def run_sweep(
    workload: Sequence[WorkItem],
    adapter: BenchmarkAdapter,
    config: SweepConfig,
) -> BenchmarkArtifact:
    """Run every predeclared point and select the cheapest passing knee."""

    normalized_workload = tuple(workload)
    _validate_workload(normalized_workload)
    _validate_evidence_contract(adapter, config)
    results = tuple(
        _run_point(normalized_workload, adapter, config, value)
        for value in config.values
    )
    passing = [result for result in results if result.passed]
    knee = min(
        passing,
        key=lambda result: (
            result.cost_per_item,
            result.total_latency_ms,
            result.value,
        ),
        default=None,
    )
    first_failing = next((result for result in results if not result.passed), None)
    return BenchmarkArtifact(
        config=config,
        adapter_name=getattr(adapter, "name", adapter.__class__.__name__),
        evidence_kind=getattr(adapter, "evidence_kind", "unspecified"),
        results=results,
        knee=knee,
        first_failing=first_failing,
    )


def _run_point(
    workload: tuple[WorkItem, ...],
    adapter: BenchmarkAdapter,
    config: SweepConfig,
    value: int,
) -> SweepMetrics:
    requested_ids: list[str] = []
    returned_ids: list[str] = []
    correct_ids: list[str] = []
    incorrect_ids: list[str] = []
    dropped_ids: list[str] = []
    duplicate_ids: list[str] = []
    unexpected_ids: list[str] = []
    misalignment_events: list[dict[str, Any]] = []
    total_cost = 0.0
    cost_unit: str | None = None
    latencies: list[float] = []

    chunk_size = config.chunk_size_for(value)
    chunks = [workload[offset : offset + chunk_size] for offset in range(0, len(workload), chunk_size)]
    for call_index, chunk in enumerate(chunks):
        context = SweepContext(
            parameter=config.parameter,
            value=value,
            call_index=call_index,
        )
        started_ns = perf_counter_ns()
        response = adapter.run_batch(chunk, context)
        elapsed_ms = (perf_counter_ns() - started_ns) / 1_000_000
        if not isinstance(response, BatchResponse):
            raise TypeError("adapter.run_batch must return BatchResponse")

        latency_ms = response.latency_ms if response.latency_ms is not None else elapsed_ms
        latencies.append(latency_ms)
        total_cost += response.cost
        if cost_unit is None:
            cost_unit = response.cost_unit
        elif cost_unit != response.cost_unit:
            raise ValueError("adapter returned inconsistent cost units")

        chunk_requested_ids = [item.id for item in chunk]
        chunk_returned_ids = [item.id for item in response.items]
        requested_ids.extend(chunk_requested_ids)
        returned_ids.extend(chunk_returned_ids)

        counts = Counter(chunk_returned_ids)
        for item_id, count in counts.items():
            if count > 1:
                duplicate_ids.extend([item_id] * (count - 1))

        expected_ids = set(chunk_requested_ids)
        unexpected_ids.extend(item.id for item in response.items if item.id not in expected_ids)
        first_by_id: dict[str, ReturnedItem] = {}
        for returned in response.items:
            first_by_id.setdefault(returned.id, returned)

        for requested in chunk:
            returned = first_by_id.get(requested.id)
            if returned is None:
                dropped_ids.append(requested.id)
            elif returned.output == requested.expected:
                correct_ids.append(requested.id)
            else:
                incorrect_ids.append(requested.id)

        overlap = min(len(chunk), len(response.items))
        for position in range(overlap):
            expected_id = chunk[position].id
            returned_id = response.items[position].id
            if expected_id != returned_id:
                misalignment_events.append(
                    {
                        "call_index": call_index,
                        "position": position,
                        "expected_id": expected_id,
                        "returned_id": returned_id,
                    }
                )

    requested_count = len(requested_ids)
    returned_count = len(returned_ids)
    correctness = len(correct_ids) / requested_count
    completeness = (requested_count - len(dropped_ids)) / requested_count
    uniqueness = max(0.0, 1.0 - len(duplicate_ids) / requested_count)
    alignment = max(0.0, 1.0 - len(misalignment_events) / requested_count)
    id_precision = (
        max(0.0, (returned_count - len(unexpected_ids) - len(duplicate_ids)) / returned_count)
        if returned_count
        else 0.0
    )
    dimensions = {
        "correctness": correctness,
        "completeness": completeness,
        "uniqueness": uniqueness,
        "alignment": alignment,
        "id_precision": id_precision,
    }
    quality_score = min(dimensions.values())
    passed = quality_score >= config.quality_floor
    total_latency_ms = sum(latencies)
    ordered_latencies = sorted(latencies)
    p95_index = max(0, math.ceil(0.95 * len(ordered_latencies)) - 1)

    return SweepMetrics(
        parameter=config.parameter,
        value=value,
        quality_floor=config.quality_floor,
        passed=passed,
        requested_ids=tuple(requested_ids),
        returned_ids=tuple(returned_ids),
        correct_ids=tuple(correct_ids),
        incorrect_ids=tuple(incorrect_ids),
        dropped_ids=tuple(dropped_ids),
        duplicate_ids=tuple(duplicate_ids),
        unexpected_ids=tuple(unexpected_ids),
        misalignment_events=tuple(misalignment_events),
        quality_score=quality_score,
        quality_dimensions=dimensions,
        total_cost=total_cost,
        cost_per_item=total_cost / requested_count,
        cost_unit=cost_unit or "cost_units",
        total_latency_ms=total_latency_ms,
        mean_call_latency_ms=total_latency_ms / len(latencies),
        p95_call_latency_ms=ordered_latencies[p95_index],
        calls=len(latencies),
    )


def _validate_workload(workload: Sequence[WorkItem]) -> None:
    if not workload:
        raise ValueError("workload must contain at least one item")
    if any(not isinstance(item, WorkItem) for item in workload):
        raise TypeError("workload entries must be WorkItem instances")
    ids = [item.id for item in workload]
    duplicates = [item_id for item_id, count in Counter(ids).items() if count > 1]
    if duplicates:
        raise ValueError(f"workload IDs must be unique; duplicates: {duplicates}")


def _validate_evidence_contract(
    adapter: BenchmarkAdapter,
    config: SweepConfig,
) -> None:
    """Keep artifact labels consistent with adapter provenance."""

    evidence_kind = str(getattr(adapter, "evidence_kind", "unspecified")).lower()
    required_labels = {
        "synthetic": DEFAULT_EVIDENCE_LABEL,
        "test": TEST_EVIDENCE_LABEL,
        "live": LIVE_EVIDENCE_LABEL,
    }
    required_label = required_labels.get(evidence_kind)
    if required_label is not None and config.evidence_label != required_label:
        raise ValueError(
            f"{evidence_kind} adapters require evidence_label={required_label!r}"
        )
    if config.evidence_label.startswith("MEASURED ·") and evidence_kind not in {
        "test",
        "live",
    }:
        raise ValueError("measured evidence labels require a test or live adapter")
