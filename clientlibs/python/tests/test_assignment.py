"""Tests for the Assignment wrapper class (Phase 5)."""

from unittest.mock import AsyncMock, MagicMock

from upgrade_client_lib.assignment import Assignment
from upgrade_client_lib.types.enums import ExperimentType, MarkedDecisionPointStatus, PayloadType
from upgrade_client_lib.types.responses import (
    AssignedCondition,
    AssignedFactor,
    ExperimentAssignment,
    MarkDecisionPointResponse,
    Payload,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

MARK_RESPONSE = MarkDecisionPointResponse(
    id="mark-1",
    userId="user-1",
    site="home",
    target="banner",
    experimentId="exp-1",
    condition="control",
)


def make_api_service(mark_return: MarkDecisionPointResponse = MARK_RESPONSE) -> MagicMock:
    svc = MagicMock()
    svc.mark_decision_point = AsyncMock(return_value=mark_return)
    svc.mark_decision_point_sync = MagicMock(return_value=mark_return)
    return svc


def simple_raw(
    site: str = "home",
    target: str | None = "banner",
    condition_code: str = "control",
    payload: Payload | None = None,
    experiment_id: str | None = "exp-1",
    condition_id: str = "cond-1",
) -> ExperimentAssignment:
    return ExperimentAssignment(
        site=site,
        target=target,
        experimentType=ExperimentType.SIMPLE,
        assignedCondition=[
            AssignedCondition(
                id=condition_id,
                conditionCode=condition_code,
                payload=payload,
                experimentId=experiment_id,
            )
        ],
    )


def factorial_raw(
    factors: dict[str, AssignedFactor] | None = None,
) -> ExperimentAssignment:
    if factors is None:
        factors = {
            "color": AssignedFactor(
                level="red",
                payload=Payload(type=PayloadType.STRING, value="red"),
            ),
            "size": AssignedFactor(level="large", payload=None),
        }
    return ExperimentAssignment(
        site="home",
        target="banner",
        experimentType=ExperimentType.FACTORIAL,
        assignedCondition=[AssignedCondition(id="cond-1", conditionCode="combo-A")],
        assignedFactor=[factors],
    )


# ---------------------------------------------------------------------------
# Simple experiment
# ---------------------------------------------------------------------------


class TestSimpleExperiment:
    def test_get_condition(self) -> None:
        a = Assignment(simple_raw(condition_code="treatment"), make_api_service())
        assert a.get_condition() == "treatment"

    def test_get_condition_control(self) -> None:
        a = Assignment(simple_raw(condition_code="control"), make_api_service())
        assert a.get_condition() == "control"

    def test_get_payload_none(self) -> None:
        a = Assignment(simple_raw(payload=None), make_api_service())
        assert a.get_payload() is None

    def test_get_payload_string(self) -> None:
        p = Payload(type=PayloadType.STRING, value="variant-A")
        a = Assignment(simple_raw(payload=p), make_api_service())
        result = a.get_payload()
        assert result is not None
        assert result.type == PayloadType.STRING
        assert result.value == "variant-A"

    def test_get_payload_json(self) -> None:
        p = Payload(type=PayloadType.JSON, value='{"key":"val"}')
        a = Assignment(simple_raw(payload=p), make_api_service())
        result = a.get_payload()
        assert result is not None
        assert result.type == PayloadType.JSON

    def test_get_experiment_type(self) -> None:
        a = Assignment(simple_raw(), make_api_service())
        assert a.get_experiment_type() == ExperimentType.SIMPLE

    def test_factors_empty_for_simple(self) -> None:
        a = Assignment(simple_raw(), make_api_service())
        assert a.factors == []

    def test_get_factor_level_none_for_simple(self) -> None:
        a = Assignment(simple_raw(), make_api_service())
        assert a.get_factor_level("color") is None

    def test_get_factor_payload_none_for_simple(self) -> None:
        a = Assignment(simple_raw(), make_api_service())
        assert a.get_factor_payload("color") is None


# ---------------------------------------------------------------------------
# Factorial experiment
# ---------------------------------------------------------------------------


class TestFactorialExperiment:
    def test_get_experiment_type(self) -> None:
        a = Assignment(factorial_raw(), make_api_service())
        assert a.get_experiment_type() == ExperimentType.FACTORIAL

    def test_get_condition_from_first_condition(self) -> None:
        a = Assignment(factorial_raw(), make_api_service())
        assert a.get_condition() == "combo-A"

    def test_factors_returns_all_keys(self) -> None:
        a = Assignment(factorial_raw(), make_api_service())
        assert set(a.factors) == {"color", "size"}

    def test_get_factor_level_hit(self) -> None:
        a = Assignment(factorial_raw(), make_api_service())
        assert a.get_factor_level("color") == "red"
        assert a.get_factor_level("size") == "large"

    def test_get_factor_level_miss(self) -> None:
        a = Assignment(factorial_raw(), make_api_service())
        assert a.get_factor_level("unknown") is None

    def test_get_factor_payload_with_value(self) -> None:
        a = Assignment(factorial_raw(), make_api_service())
        result = a.get_factor_payload("color")
        assert result is not None
        assert result.value == "red"

    def test_get_factor_payload_none_when_no_payload(self) -> None:
        a = Assignment(factorial_raw(), make_api_service())
        assert a.get_factor_payload("size") is None

    def test_get_factor_payload_miss(self) -> None:
        a = Assignment(factorial_raw(), make_api_service())
        assert a.get_factor_payload("unknown") is None

    def test_factors_empty_when_no_factor_data(self) -> None:
        raw = ExperimentAssignment(
            site="home",
            target="banner",
            experimentType=ExperimentType.FACTORIAL,
            assignedCondition=[AssignedCondition(id="c1", conditionCode="X")],
            assignedFactor=None,
        )
        a = Assignment(raw, make_api_service())
        assert a.factors == []
        assert a.get_factor_level("color") is None
        assert a.get_factor_payload("color") is None

    def test_uses_first_factor_entry(self) -> None:
        """assignedFactor[0] is the active factor set after rotation."""
        raw = ExperimentAssignment(
            site="home",
            target="banner",
            experimentType=ExperimentType.FACTORIAL,
            assignedCondition=[AssignedCondition(id="c1", conditionCode="X")],
            assignedFactor=[
                {"color": AssignedFactor(level="red")},
                {"color": AssignedFactor(level="blue")},
            ],
        )
        a = Assignment(raw, make_api_service())
        assert a.get_factor_level("color") == "red"


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------


class TestEdgeCases:
    def test_empty_condition_list_gives_empty_string(self) -> None:
        raw = ExperimentAssignment(
            site="home",
            target="banner",
            experimentType=ExperimentType.SIMPLE,
            assignedCondition=[],
        )
        a = Assignment(raw, make_api_service())
        assert a.get_condition() == ""
        assert a.get_payload() is None

    def test_no_experiment_id(self) -> None:
        a = Assignment(simple_raw(experiment_id=None), make_api_service())
        assert a.get_condition() == "control"

    def test_get_payload_empty_value_is_none(self) -> None:
        """Factor payload with empty value string should be treated as absent."""
        raw = factorial_raw(
            factors={
                "size": AssignedFactor(
                    level="medium",
                    payload=Payload(type=PayloadType.STRING, value=""),
                )
            }
        )
        a = Assignment(raw, make_api_service())
        assert a.get_factor_payload("size") is None


# ---------------------------------------------------------------------------
# mark_decision_point — async
# ---------------------------------------------------------------------------


class TestMarkDecisionPointAsync:
    async def test_calls_api_service(self) -> None:
        svc = make_api_service()
        a = Assignment(simple_raw(), svc)
        result = await a.mark_decision_point(MarkedDecisionPointStatus.CONDITION_APPLIED)
        assert result is MARK_RESPONSE
        svc.mark_decision_point.assert_called_once()

    async def test_passes_site_target_condition(self) -> None:
        svc = make_api_service()
        a = Assignment(simple_raw(site="checkout", target="cta", condition_code="treatment"), svc)
        await a.mark_decision_point(MarkedDecisionPointStatus.CONDITION_APPLIED)
        _, kwargs = svc.mark_decision_point.call_args
        assert kwargs["site"] == "checkout"
        assert kwargs["target"] == "cta"
        assert kwargs["condition_code"] == "treatment"
        assert kwargs["status"] == MarkedDecisionPointStatus.CONDITION_APPLIED

    async def test_passes_experiment_and_condition_ids(self) -> None:
        svc = make_api_service()
        a = Assignment(simple_raw(experiment_id="exp-99", condition_id="cond-99"), svc)
        await a.mark_decision_point(MarkedDecisionPointStatus.CONDITION_APPLIED)
        _, kwargs = svc.mark_decision_point.call_args
        assert kwargs["experiment_id"] == "exp-99"
        assert kwargs["condition_id"] == "cond-99"

    async def test_passes_uniquifier_and_client_error(self) -> None:
        svc = make_api_service()
        a = Assignment(simple_raw(), svc)
        await a.mark_decision_point(
            MarkedDecisionPointStatus.CONDITION_FAILED_TO_APPLY,
            uniquifier="u-abc",
            client_error="variant not recognized",
        )
        _, kwargs = svc.mark_decision_point.call_args
        assert kwargs["uniquifier"] == "u-abc"
        assert kwargs["client_error"] == "variant not recognized"

    async def test_empty_uniquifier_becomes_none(self) -> None:
        svc = make_api_service()
        a = Assignment(simple_raw(), svc)
        await a.mark_decision_point(MarkedDecisionPointStatus.CONDITION_APPLIED)
        _, kwargs = svc.mark_decision_point.call_args
        assert kwargs["uniquifier"] is None
        assert kwargs["client_error"] is None

    async def test_passes_experiment_type(self) -> None:
        svc = make_api_service()
        a = Assignment(simple_raw(), svc)
        await a.mark_decision_point(MarkedDecisionPointStatus.CONDITION_APPLIED)
        _, kwargs = svc.mark_decision_point.call_args
        assert kwargs["experiment_type"] == ExperimentType.SIMPLE

    async def test_passes_serialized_factor_for_factorial(self) -> None:
        svc = make_api_service()
        a = Assignment(factorial_raw(), svc)
        await a.mark_decision_point(MarkedDecisionPointStatus.CONDITION_APPLIED)
        _, kwargs = svc.mark_decision_point.call_args
        factor = kwargs["assigned_factor"]
        assert factor is not None
        assert "color" in factor
        assert factor["color"]["level"] == "red"

    async def test_no_factor_for_simple(self) -> None:
        svc = make_api_service()
        a = Assignment(simple_raw(), svc)
        await a.mark_decision_point(MarkedDecisionPointStatus.CONDITION_APPLIED)
        _, kwargs = svc.mark_decision_point.call_args
        assert kwargs["assigned_factor"] is None

    async def test_null_target_passed_through(self) -> None:
        """target="" from the API should be forwarded as-is to mark_decision_point."""
        svc = make_api_service()
        a = Assignment(simple_raw(target=""), svc)
        await a.mark_decision_point(MarkedDecisionPointStatus.CONDITION_APPLIED)
        _, kwargs = svc.mark_decision_point.call_args
        assert kwargs["target"] == ""


# ---------------------------------------------------------------------------
# mark_decision_point — sync
# ---------------------------------------------------------------------------


class TestMarkDecisionPointSync:
    def test_calls_api_service_sync(self) -> None:
        svc = make_api_service()
        a = Assignment(simple_raw(), svc)
        result = a.mark_decision_point_sync(MarkedDecisionPointStatus.CONDITION_APPLIED)
        assert result is MARK_RESPONSE
        svc.mark_decision_point_sync.assert_called_once()

    def test_passes_correct_args(self) -> None:
        svc = make_api_service()
        a = Assignment(simple_raw(site="quiz", target="q1", condition_code="hint"), svc)
        a.mark_decision_point_sync(
            MarkedDecisionPointStatus.NO_CONDITION_ASSIGNED,
            uniquifier="u1",
        )
        _, kwargs = svc.mark_decision_point_sync.call_args
        assert kwargs["site"] == "quiz"
        assert kwargs["target"] == "q1"
        assert kwargs["condition_code"] == "hint"
        assert kwargs["status"] == MarkedDecisionPointStatus.NO_CONDITION_ASSIGNED
        assert kwargs["uniquifier"] == "u1"
        assert kwargs["client_error"] is None

    def test_empty_uniquifier_becomes_none_sync(self) -> None:
        svc = make_api_service()
        a = Assignment(simple_raw(), svc)
        a.mark_decision_point_sync(MarkedDecisionPointStatus.CONDITION_APPLIED)
        _, kwargs = svc.mark_decision_point_sync.call_args
        assert kwargs["uniquifier"] is None
