"""DataService — in-memory caching layer for assignments and feature flags.

``None`` values represent a cold (un-populated) cache; an empty collection
means the server returned nothing.  This distinction lets callers decide
whether a network fetch is required.

Cache lifecycle
---------------
* Populated by calling :meth:`set_assignments` / :meth:`set_feature_flags`.
* :meth:`add_decision_point_assignments` adds single decision points to the
  assignment cache without marking it as holding the full context, so
  :meth:`get_full_context_assignments` still reports it as cold.
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
        # True once a full-context /assign response filled the cache, rather than single decision points
        self._full_context_cached = False
        # None  → cache cold
        # set   → cache warm (may be empty)
        self._feature_flags: set[str] | None = None

    # ------------------------------------------------------------------
    # Assignments
    # ------------------------------------------------------------------

    @staticmethod
    def _key(site: str, target: str | None) -> str:
        return f"{site}|{target or ''}"

    def clear_assignments(self) -> None:
        """Invalidate only the assignment cache, so the next lookup refetches."""
        self._assignments = None
        self._full_context_cached = False

    def set_assignments(self, assignments: list[ExperimentAssignment]) -> None:
        """Populate the assignment cache from a fresh full-context API response."""
        self._assignments = {self._key(a.site, a.target): a for a in assignments}
        self._full_context_cached = True

    def add_decision_point_assignments(self, assignments: list[ExperimentAssignment]) -> None:
        """Add a single decision point's /assign response to the cache.

        Does nothing if a full-context response already filled the cache.  Decision points the cache already
        holds are skipped, so their rotation state is kept.
        """
        if self._full_context_cached:
            return
        cached = self._assignments if self._assignments is not None else {}
        for a in assignments:
            cached.setdefault(self._key(a.site, a.target), a)
        self._assignments = cached

    def has_decision_point(self, site: str, target: str | None) -> bool:
        """Return ``True`` if the cache can answer a lookup of ``site``/``target`` without asking the server.

        A full-context cache answers any decision point, even one with no assignment.  A cache of single
        decision points answers only one it holds.
        """
        if self._assignments is None:
            return False
        return self._full_context_cached or self._key(site, target) in self._assignments

    def get_full_context_assignments(self) -> list[ExperimentAssignment] | None:
        """Return all cached assignments if a full-context response filled the cache, else ``None``."""
        return self.get_all_assignments() if self._full_context_cached else None

    def get_all_assignments(self) -> list[ExperimentAssignment] | None:
        """Return all cached assignments, or ``None`` if the cache is cold."""
        assignments = self._assignments
        return None if assignments is None else list(assignments.values())

    def get_assignment(self, site: str, target: str | None) -> ExperimentAssignment | None:
        """Return the cached assignment for ``site``/``target``, or ``None``.

        Matched exactly (case-sensitive), as the server matches decision points.  A ``None`` target is the same
        as ``""``.
        """
        assignments = self._assignments
        return None if assignments is None else assignments.get(self._key(site, target))

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

    def clear_feature_flags(self) -> None:
        """Invalidate only the feature flag cache, so the next lookup refetches."""
        self._feature_flags = None

    def set_feature_flags(self, flags: list[str]) -> None:
        """Populate the feature-flag cache from a fresh API response."""
        self._feature_flags = set(flags)

    def get_feature_flags(self) -> list[str] | None:
        """Return cached flag keys, or ``None`` if the cache is cold."""
        flags = self._feature_flags
        return None if flags is None else list(flags)

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

        Called after any call that may have changed the user's identity or
        groups (``init``, ``set_group_membership``, ``set_working_group``,
        ``set_alt_user_ids``), since assignments and feature flags depend on them.
        """
        self.clear_assignments()
        self.clear_feature_flags()
