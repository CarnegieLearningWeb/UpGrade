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

import threading

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
        # Each cache's generation is bumped on every invalidation, so a response to a request sent before it isn't
        # cached over it.  The locks make the generation check and cache write atomic across threads using the
        # _sync methods.
        self._assignment_generation = 0
        self._assignment_lock = threading.Lock()
        self._feature_flag_generation = 0
        self._feature_flag_lock = threading.Lock()

    # ------------------------------------------------------------------
    # Assignments
    # ------------------------------------------------------------------

    @staticmethod
    def _key(site: str, target: str | None) -> str:
        return f"{site}|{target or ''}"

    def clear_assignments(self) -> None:
        """Invalidate only the assignment cache, so the next lookup refetches."""
        with self._assignment_lock:
            self._assignments = None
            self._assignment_generation += 1

    def get_assignment_generation(self) -> int:
        """Return the current invalidation generation; capture it before requesting assignments."""
        return self._assignment_generation

    def set_assignments(self, assignments: list[ExperimentAssignment], generation: int | None = None) -> None:
        """Populate the assignment cache from a fresh API response.

        When ``generation`` is given, the cache is only written if no invalidation happened since it was read
        with :meth:`get_assignment_generation`.
        """
        with self._assignment_lock:
            if generation is None or generation == self._assignment_generation:
                self._assignments = {self._key(a.site, a.target): a for a in assignments}

    @classmethod
    def find_assignment(
        cls, assignments: list[ExperimentAssignment], site: str, target: str | None
    ) -> ExperimentAssignment | None:
        """Find the assignment for ``site``/``target`` in a list, matched the same way as :meth:`get_assignment`."""
        key = cls._key(site, target)
        return next((a for a in assignments if cls._key(a.site, a.target) == key), None)
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
        with self._feature_flag_lock:
            self._feature_flags = None
            self._feature_flag_generation += 1

    def get_feature_flag_generation(self) -> int:
        """Return the current invalidation generation; capture it before requesting flags."""
        return self._feature_flag_generation

    def set_feature_flags(self, flags: list[str], generation: int | None = None) -> None:
        """Populate the feature-flag cache from a fresh API response.

        When ``generation`` is given, the cache is only written if no invalidation happened since it was read
        with :meth:`get_feature_flag_generation`.
        """
        with self._feature_flag_lock:
            if generation is None or generation == self._feature_flag_generation:
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

        Called after any call that may have changed the user's groups (``init``,
        ``set_group_membership``, ``set_working_group``), since assignments and
        feature flags both depend on them.
        """
        self.clear_assignments()
        self.clear_feature_flags()
