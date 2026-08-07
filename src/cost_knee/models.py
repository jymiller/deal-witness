"""Data models for a cost/quality sweep.

The models deliberately use only Python's standard library.  Adapter authors can
map any provider response into :class:`BatchResponse` without coupling this
package to a vendor SDK or transport.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping


DEFAULT_EVIDENCE_LABEL = "PRERUN · SYNTHETIC"
TEST_EVIDENCE_LABEL = "MEASURED · TEST"
LIVE_EVIDENCE_LABEL = "MEASURED · LIVE"


@dataclass(frozen=True)
class WorkItem:
    """One requested evaluation item and its predeclared expected value."""

    id: str
    expected: Any
    metadata: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not isinstance(self.id, str) or not self.id.strip():
            raise ValueError("work item id must be a non-empty string")


@dataclass(frozen=True)
class ReturnedItem:
    """One adapter result, retaining the ID needed for alignment checks."""

    id: str
    output: Any

    def __post_init__(self) -> None:
        if not isinstance(self.id, str) or not self.id.strip():
            raise ValueError("returned item id must be a non-empty string")


@dataclass(frozen=True)
class BatchResponse:
    """Normalized response returned by a benchmark adapter.

    ``cost`` and ``latency_ms`` are supplied by the adapter.  A real adapter can
    therefore report provider-metered evidence, while the bundled synthetic
    adapter reports explicitly synthetic units and deterministic latency.
    """

    items: tuple[ReturnedItem, ...]
    cost: float
    latency_ms: float | None
    cost_unit: str = "cost_units"
    metadata: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "items", tuple(self.items))
        if self.cost < 0:
            raise ValueError("response cost must be non-negative")
        if self.latency_ms is not None and self.latency_ms < 0:
            raise ValueError("response latency must be non-negative")
        if not self.cost_unit:
            raise ValueError("cost_unit must be non-empty")


@dataclass(frozen=True)
class SweepContext:
    """Context passed to every adapter call."""

    parameter: str
    value: int
    call_index: int


@dataclass(frozen=True)
class SweepConfig:
    """A predeclared sweep and its quality gate.

    For a batch-size sweep, leave ``parameter`` as ``"batch_size"`` and
    ``items_per_call`` unset; each sweep value becomes the chunk size.  For a
    provider-specific parameter such as ``retrieval_budget`` or ``top_k``, the
    value is passed through :class:`SweepContext` and calls default to one work
    item each.  ``items_per_call`` can override that behavior explicitly.
    """

    values: tuple[int, ...]
    quality_floor: float
    parameter: str = "batch_size"
    evidence_label: str = DEFAULT_EVIDENCE_LABEL
    items_per_call: int | None = None

    def __post_init__(self) -> None:
        values = tuple(self.values)
        object.__setattr__(self, "values", values)
        if not values:
            raise ValueError("at least one sweep value is required")
        if any(not isinstance(value, int) or isinstance(value, bool) or value <= 0 for value in values):
            raise ValueError("sweep values must be positive integers")
        if any(left >= right for left, right in zip(values, values[1:])):
            raise ValueError("sweep values must be unique and strictly increasing")
        if not 0 <= self.quality_floor <= 1:
            raise ValueError("quality_floor must be between 0 and 1")
        if not isinstance(self.parameter, str) or not self.parameter.strip():
            raise ValueError("parameter must be a non-empty string")
        if not isinstance(self.evidence_label, str) or not self.evidence_label.strip():
            raise ValueError("evidence_label must be a non-empty string")
        if self.items_per_call is not None and self.items_per_call <= 0:
            raise ValueError("items_per_call must be positive when supplied")

    def chunk_size_for(self, value: int) -> int:
        if self.items_per_call is not None:
            return self.items_per_call
        return value if self.parameter == "batch_size" else 1


@dataclass(frozen=True)
class SweepMetrics:
    """All independently counted evidence for one sweep value."""

    parameter: str
    value: int
    quality_floor: float
    passed: bool
    requested_ids: tuple[str, ...]
    returned_ids: tuple[str, ...]
    correct_ids: tuple[str, ...]
    incorrect_ids: tuple[str, ...]
    dropped_ids: tuple[str, ...]
    duplicate_ids: tuple[str, ...]
    unexpected_ids: tuple[str, ...]
    misalignment_events: tuple[Mapping[str, Any], ...]
    quality_score: float
    quality_dimensions: Mapping[str, float]
    total_cost: float
    cost_per_item: float
    cost_unit: str
    total_latency_ms: float
    mean_call_latency_ms: float
    p95_call_latency_ms: float
    calls: int

    def to_dict(self) -> dict[str, Any]:
        result: dict[str, Any] = {
            "sweep_parameter": self.parameter,
            "sweep_value": self.value,
            "passed_quality_floor": self.passed,
            "requested": {
                "count": len(self.requested_ids),
                "ids": list(self.requested_ids),
            },
            "returned": {
                "count": len(self.returned_ids),
                "ids": list(self.returned_ids),
            },
            "correctness": {
                "correct": len(self.correct_ids),
                "incorrect": len(self.incorrect_ids),
                "rate": self.quality_dimensions["correctness"],
                "correct_ids": list(self.correct_ids),
                "incorrect_ids": list(self.incorrect_ids),
            },
            "dropped": {
                "count": len(self.dropped_ids),
                "ids": list(self.dropped_ids),
            },
            "duplicates": {
                "count": len(self.duplicate_ids),
                "ids": list(self.duplicate_ids),
            },
            "misalignment": {
                "count": len(self.misalignment_events),
                "events": [dict(event) for event in self.misalignment_events],
            },
            "unexpected": {
                "count": len(self.unexpected_ids),
                "ids": list(self.unexpected_ids),
            },
            "quality": {
                "score": self.quality_score,
                "floor": self.quality_floor,
                "passed": self.passed,
                "aggregation": "minimum_dimension",
                "dimensions": dict(self.quality_dimensions),
            },
            "cost": {
                "total": self.total_cost,
                "per_item": self.cost_per_item,
                "unit": self.cost_unit,
            },
            "latency": {
                "total_ms": self.total_latency_ms,
                "mean_call_ms": self.mean_call_latency_ms,
                "p95_call_ms": self.p95_call_latency_ms,
                "calls": self.calls,
            },
        }
        if self.parameter == "batch_size":
            result["batch_size"] = self.value
        return result


@dataclass(frozen=True)
class BenchmarkArtifact:
    """Serializable benchmark output with an explicit evidence status."""

    config: SweepConfig
    adapter_name: str
    evidence_kind: str
    results: tuple[SweepMetrics, ...]
    knee: SweepMetrics | None
    first_failing: SweepMetrics | None

    def to_dict(self) -> dict[str, Any]:
        normalized_kind = self.evidence_kind.lower()
        if normalized_kind == "synthetic":
            claim_status = "preflight_only"
            notice = (
                "Synthetic preflight only; do not present these values as "
                "measured product results."
            )
        elif normalized_kind == "test":
            claim_status = "test_only"
            notice = "Measured test evidence; this is not a live product result."
        elif normalized_kind == "live":
            claim_status = "measured_live"
            notice = "Measured live evidence from the declared adapter."
        else:
            claim_status = "caller_supplied_evidence"
            notice = "Evidence label and provenance were supplied by the caller."
        evidence = {
            "kind": self.evidence_kind,
            "adapter": self.adapter_name,
            "claim_status": claim_status,
            "notice": notice,
        }
        knee = None
        if self.knee is not None:
            knee = {
                "sweep_parameter": self.knee.parameter,
                "sweep_value": self.knee.value,
                "cost_per_item": self.knee.cost_per_item,
                "cost_unit": self.knee.cost_unit,
                "quality_score": self.knee.quality_score,
            }
            if self.knee.parameter == "batch_size":
                knee["batch_size"] = self.knee.value

        first_failing = None
        if self.first_failing is not None:
            first_failing = {
                "sweep_parameter": self.first_failing.parameter,
                "sweep_value": self.first_failing.value,
                "quality_score": self.first_failing.quality_score,
            }
            if self.first_failing.parameter == "batch_size":
                first_failing["batch_size"] = self.first_failing.value

        selection: dict[str, Any] = {
            "rule": "lowest cost/item among points meeting the predeclared quality floor",
            "knee": knee,
            "first_failing": first_failing,
            "first_failing_value": self.first_failing.value if self.first_failing else None,
        }
        if self.config.parameter == "batch_size":
            selection["first_failing_size"] = (
                self.first_failing.value if self.first_failing else None
            )

        return {
            "schema_version": "cost-knee/v1",
            "label": self.config.evidence_label,
            "evidence": evidence,
            "configuration": {
                "sweep_parameter": self.config.parameter,
                "sweep_values": list(self.config.values),
                "quality_floor": self.config.quality_floor,
                "quality_aggregation": "minimum_dimension",
                "items_per_call": self.config.items_per_call,
            },
            "results": [result.to_dict() for result in self.results],
            "selection": selection,
        }
