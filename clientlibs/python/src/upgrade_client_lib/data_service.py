"""DataService — in-memory caching layer for assignments and feature flags.

``None`` values represent a cold (un-populated) cache; an empty collection
means the server returned nothing.  This distinction lets callers decide
whether a network fetch is required.

Cache lifecycle
---------------
* Populated by calling :meth:`set_assignments` / :meth:`set_feature_flags`.
* Invalidated by calling :meth:`clear` (triggered by ``UpgradeClient.init``).
* Each ``UpgradeClient`` instance owns its own ``DataService`` — there is no
  shared/global state.

Assignment rotation
-------------------
The UpGrade backend may return multiple conditions for the same decision
point (e.g. for gradual roll-outs).  :meth:`rotate_assignment` advances the
head of the condition/factor lists after each mark so that successive calls
cycle through them.  :meth:`rotate_assignments_by_experiment_id` applies that
rotation across every cached assignment that belongs to the marked experiment.
This mirrors the behaviour of the JS ``DataService``.
"""

from __future__ import annotations

from upgrade_client_lib.types.responses import ExperimentAssignment


class DataService:
    """Per-client in-memory store for experiment assignments and feature flags."""

    def __init__(self) -> None:
        # None  → cache cold (never populated or cleared)
        # dict  → cache warm (may be empty if server returned nothing)
        self._assignments: dict[str, ExperimentAssignment] | None = None
        # None  → cache cold
        # set   → cache warm (may be empty)
        self._feature_flags: set[str] | None = None

    # ------------------------------------------------------------------
    # Assignments
    # ------------------------------------------------------------------

    @staticmethod
    def _assignment_key(site: str, target: str) -> str:
        return f"{site}|{target}"

    def set_assignments(self, assignments: list[ExperimentAssignment]) -> None:
        """Populate the assignment cache from a fresh API response."""
        self._assignments = {self._assignment_key(a.site, a.target or ""): a for a in assignments}

    def upsert_assignments(self, assignments: list[ExperimentAssignment]) -> None:
        """Merge fresh assignment rows into the cache without dropping other decision points."""
        if self._assignments is None:
            self._assignments = {}
        for assignment in assignments:
            self._assignments[self._assignment_key(assignment.site, assignment.target or "")] = assignment

    def get_all_assignments(self) -> list[ExperimentAssignment] | None:
        """Return all cached assignments, or ``None`` if the cache is cold."""
        if self._assignments is None:
            return None
        return list(self._assignments.values())

    def get_assignment(self, site: str, target: str) -> ExperimentAssignment | None:
        """Return the cached assignment for ``site``/``target``, or ``None``."""
        if self._assignments is None:
            return None
        return self._assignments.get(self._assignment_key(site, target))

    def rotate_assignment(self, assignment: ExperimentAssignment) -> ExperimentAssignment:
        """Round-robin advance the condition (and factor) lists.

        When there is only one condition nothing changes.  Mutates the
        assignment in place (the cached reference is the same object) and
        also returns it for convenience.
        """
        if len(assignment.assignedCondition) > 1:
            assignment.assignedCondition.append(assignment.assignedCondition.pop(0))
            if assignment.assignedFactor and len(assignment.assignedFactor) > 1:
                assignment.assignedFactor.append(assignment.assignedFactor.pop(0))
        return assignment

    def rotate_assignments_by_experiment_id(self, experiment_id: str) -> None:
        """Rotate every cached assignment whose conditions match ``experiment_id``."""
        if not experiment_id or self._assignments is None:
            return

        for assignment in self._assignments.values():
            if any(c.experimentId == experiment_id for c in assignment.assignedCondition):
                self.rotate_assignment(assignment)

    # ------------------------------------------------------------------
    # Feature flags
    # ------------------------------------------------------------------

    def set_feature_flags(self, flags: list[str]) -> None:
        """Populate the feature-flag cache from a fresh API response."""
        self._feature_flags = set(flags)

    def get_feature_flags(self) -> list[str] | None:
        """Return cached flag keys, or ``None`` if the cache is cold."""
        if self._feature_flags is None:
            return None
        return list(self._feature_flags)

    def has_feature_flag(self, key: str) -> bool:
        """Return ``True`` only when flags are cached *and* ``key`` is present.

        Returns ``False`` for a cold cache — the caller should check
        :meth:`get_feature_flags` for ``None`` to decide whether a fetch is
        needed.
        """
        if self._feature_flags is None:
            return False
        return key in self._feature_flags

    # ------------------------------------------------------------------
    # Cache management
    # ------------------------------------------------------------------

    def clear(self) -> None:
        """Invalidate all cached data.

        Called by ``UpgradeClient.init`` so that the next request for
        assignments or flags triggers a fresh fetch.
        """
        self._assignments = None
        self._feature_flags = None
