"""Assignment wrapper class.

Wraps a raw :class:`~upgrade_client_lib.types.responses.ExperimentAssignment`
and exposes a high-level interface for reading condition/payload/factor data
and marking the decision point.

The class mirrors the JS ``Assignment`` class in
``clientlibs/js/src/Assignment/Assignment.ts``.

Usage
-----
Instances are created by :class:`~upgrade_client_lib.client.UpgradeClient`,
not constructed directly::

    assignments = await client.get_all_experiment_conditions()
    a = assignments[0]

    condition = a.get_condition()           # "control"
    payload   = a.get_payload()             # Payload(type=STRING, value="…") | None
    exp_type  = a.get_experiment_type()     # ExperimentType.SIMPLE

    # Factorial only
    for factor in a.factors:
        level   = a.get_factor_level(factor)
        payload = a.get_factor_payload(factor)

    await a.mark_decision_point(MarkedDecisionPointStatus.CONDITION_APPLIED)
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from upgrade_client_lib.types.enums import ExperimentType, MarkedDecisionPointStatus
from upgrade_client_lib.types.responses import AssignedFactor, ExperimentAssignment, MarkDecisionPointResponse, Payload

if TYPE_CHECKING:
    from upgrade_client_lib.api_service import ApiService


class Assignment:
    """High-level wrapper over a single :class:`ExperimentAssignment`.

    Parameters
    ----------
    raw:
        The raw assignment returned by the UpGrade API (after any rotation
        applied by :class:`~upgrade_client_lib.data_service.DataService`).
    api_service:
        The :class:`~upgrade_client_lib.api_service.ApiService` instance used
        to send mark requests.  Injected by ``UpgradeClient``.
    """

    def __init__(self, raw: ExperimentAssignment, api_service: ApiService) -> None:
        self._site = raw.site
        self._target = raw.target
        self._experiment_type = raw.experimentType

        first = raw.assignedCondition[0] if raw.assignedCondition else None
        self._condition_code: str = first.conditionCode if first else ""
        self._payload: Payload | None = first.payload if first else None
        self._experiment_id: str | None = first.experimentId if first else None
        self._condition_id: str | None = first.id if first else None

        # Take the head of the (already-rotated) factor list, matching JS behaviour.
        self._assigned_factor: dict[str, AssignedFactor] | None = (
            raw.assignedFactor[0] if raw.assignedFactor else None
        )

        self._api_service = api_service

    # ------------------------------------------------------------------
    # Accessors
    # ------------------------------------------------------------------

    def get_condition(self) -> str:
        """Return the assigned condition code (empty string when none assigned)."""
        return self._condition_code

    def get_payload(self) -> Payload | None:
        """Return the condition payload, or ``None`` if there is no payload."""
        return self._payload

    def get_experiment_type(self) -> ExperimentType:
        """Return the experiment type (``SIMPLE`` or ``FACTORIAL``)."""
        return self._experiment_type

    # ------------------------------------------------------------------
    # Factorial accessors
    # ------------------------------------------------------------------

    @property
    def factors(self) -> list[str]:
        """Names of all factors for a ``FACTORIAL`` experiment.

        Returns an empty list for ``SIMPLE`` experiments or when no factor
        data is present.
        """
        if self._experiment_type == ExperimentType.FACTORIAL and self._assigned_factor:
            return list(self._assigned_factor.keys())
        return []

    def get_factor_level(self, factor: str) -> str | None:
        """Return the assigned level for *factor*, or ``None``.

        Returns ``None`` for ``SIMPLE`` experiments or when the factor name is
        not present in the assignment.
        """
        if self._experiment_type != ExperimentType.FACTORIAL or not self._assigned_factor:
            return None
        entry = self._assigned_factor.get(factor)
        return entry.level if entry is not None else None

    def get_factor_payload(self, factor: str) -> Payload | None:
        """Return the payload for *factor*, or ``None``.

        Returns ``None`` for ``SIMPLE`` experiments, unknown factor names, or
        when the factor has no payload value.
        """
        if self._experiment_type != ExperimentType.FACTORIAL or not self._assigned_factor:
            return None
        entry = self._assigned_factor.get(factor)
        if entry is None or entry.payload is None or not entry.payload.value:
            return None
        return entry.payload

    # ------------------------------------------------------------------
    # Mark convenience methods
    # ------------------------------------------------------------------

    async def mark_decision_point(
        self,
        status: MarkedDecisionPointStatus,
        uniquifier: str = "",
        client_error: str = "",
    ) -> MarkDecisionPointResponse:
        """Mark this decision point asynchronously.

        Parameters
        ----------
        status:
            What the client application did with the assigned condition.
        uniquifier:
            Optional string that ties logged metrics to this specific mark
            event.  Required for within-subjects experiments.
        client_error:
            Optional string describing why a condition was not applied.
        """
        return await self._api_service.mark_decision_point(
            site=self._site,
            target=self._target,
            condition_code=self._condition_code,
            status=status,
            experiment_type=self._experiment_type,
            experiment_id=self._experiment_id,
            condition_id=self._condition_id,
            assigned_factor=self._serialized_factor(),
            uniquifier=uniquifier or None,
            client_error=client_error or None,
        )

    def mark_decision_point_sync(
        self,
        status: MarkedDecisionPointStatus,
        uniquifier: str = "",
        client_error: str = "",
    ) -> MarkDecisionPointResponse:
        """Synchronous variant of :meth:`mark_decision_point`."""
        return self._api_service.mark_decision_point_sync(
            site=self._site,
            target=self._target,
            condition_code=self._condition_code,
            status=status,
            experiment_type=self._experiment_type,
            experiment_id=self._experiment_id,
            condition_id=self._condition_id,
            assigned_factor=self._serialized_factor(),
            uniquifier=uniquifier or None,
            client_error=client_error or None,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _serialized_factor(self) -> dict[str, object] | None:
        """Convert ``AssignedFactor`` objects to plain dicts for the API."""
        if not self._assigned_factor:
            return None
        return {k: v.model_dump() for k, v in self._assigned_factor.items()}
