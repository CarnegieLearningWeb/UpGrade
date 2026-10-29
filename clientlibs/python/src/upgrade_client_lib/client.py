"""UpgradeClient — primary public API class."""

from __future__ import annotations

import uuid
from typing import Any

import httpx

from upgrade_client_lib.api_service import _DEFAULT_TIMEOUT, ApiService
from upgrade_client_lib.assignment import Assignment
from upgrade_client_lib.data_service import DataService
from upgrade_client_lib.types.enums import BinaryRewardValue, MarkedDecisionPointStatus
from upgrade_client_lib.types.requests import FeatureFlagUserGroupsForSession, LogInput
from upgrade_client_lib.types.responses import (
    ExperimentAssignment,
    FeatureFlag,
    InitializeUserResponse,
    LogEventResponse,
    MarkDecisionPointResponse,
    SendRewardResponse,
    UserAliasResponse,
)


class UpgradeClient:
    """Primary interface to the UpGrade experimentation platform.

    Exposes both async and sync variants of every operation.  Use the async
    variants (no suffix) from within ``async`` code; use the ``_sync``
    variants from synchronous applications.

    Parameters
    ----------
    user_id:
        Unique identifier for the user.
    host_url:
        Base URL of the UpGrade API server (e.g. ``"https://upgrade.example.com"``).
    context:
        Application context string that scopes experiment/flag lookups.
    token:
        Optional bearer token sent in the ``Authorization`` header.
    client_session_id:
        Optional session identifier.  A UUID is generated automatically when
        omitted.
    timeout:
        HTTP request timeout in seconds, or an ``httpx.Timeout`` object for
        fine-grained control.  Defaults to ``httpx.Timeout(5.0)``, which
        matches httpx's own default and preserves the previous implicit behavior.
    feature_flag_user_groups_for_session:
        Optional session-scoped groups for feature flag evaluation, as a
        :class:`~upgrade_client_lib.types.requests.FeatureFlagUserGroupsForSession`
        or an equivalent dict with both ``groupsForSession`` and
        ``includeStoredUserGroups``.  Can be changed later with
        :meth:`set_feature_flag_user_groups_for_session`.

    Examples
    --------
    Async::

        client = UpgradeClient("user-1", "https://upgrade.example.com", "my-app")
        await client.init()
        assignment = await client.get_decision_point_assignment("home", "banner")
        if assignment:
            condition = assignment.get_condition()

    Sync::

        client = UpgradeClient("user-1", "https://upgrade.example.com", "my-app")
        client.init_sync()
        flags = client.get_all_feature_flags_sync()
    """

    # Expose enums directly on the class so callers don't need a separate import.
    MARKED_DECISION_POINT_STATUS = MarkedDecisionPointStatus
    BINARY_REWARD_VALUE = BinaryRewardValue

    def __init__(
        self,
        user_id: str,
        host_url: str,
        context: str,
        token: str = "",
        client_session_id: str | None = None,
        timeout: float | httpx.Timeout = _DEFAULT_TIMEOUT,
        feature_flag_user_groups_for_session: FeatureFlagUserGroupsForSession | dict[str, Any] | None = None,
    ) -> None:
        self._user_id = user_id
        self._context = context
        self._data_service = DataService()
        self._api_service = ApiService(
            host_url=host_url,
            user_id=user_id,
            context=context,
            token=token,
            client_session_id=client_session_id or str(uuid.uuid4()),
            timeout=timeout,
        )
        self.set_feature_flag_user_groups_for_session(feature_flag_user_groups_for_session)

    # ------------------------------------------------------------------
    # set_feature_flag_user_groups_for_session
    # ------------------------------------------------------------------

    def set_feature_flag_user_groups_for_session(
        self, options: FeatureFlagUserGroupsForSession | dict[str, Any] | None
    ) -> None:
        """Set (or, with ``None``, clear) session-scoped groups for feature flag evaluation.

        Clears the cached feature flags so the next lookup is evaluated against the new groups.
        Raises ``pydantic.ValidationError`` unless both ``groupsForSession`` and
        ``includeStoredUserGroups`` are provided.
        """
        validated = None if options is None else FeatureFlagUserGroupsForSession.model_validate(options)
        self._api_service.set_feature_flag_user_groups_for_session(validated)
        self._data_service.clear_feature_flags()

    # ------------------------------------------------------------------
    # init
    # ------------------------------------------------------------------

    async def init(
        self,
        group: dict[str, list[str]] | None = None,
        working_group: dict[str, str] | None = None,
    ) -> InitializeUserResponse:
        """Initialize (or re-initialize) the user, then clear the local cache.

        The cache is cleared once the server confirms, since ``init`` may have changed the user's groups.
        """
        response = await self._api_service.init_user(group=group, working_group=working_group)
        self._data_service.clear()
        return response

    def init_sync(
        self,
        group: dict[str, list[str]] | None = None,
        working_group: dict[str, str] | None = None,
    ) -> InitializeUserResponse:
        """Synchronous variant of :meth:`init`."""
        response = self._api_service.init_user_sync(group=group, working_group=working_group)
        self._data_service.clear()
        return response

    # ------------------------------------------------------------------
    # set_group_membership
    # ------------------------------------------------------------------

    async def set_group_membership(
        self, group: dict[str, list[str]]
    ) -> InitializeUserResponse:
        """Update the user's group membership, then clear cached assignments and feature flags."""
        response = await self._api_service.set_group_membership(group)
        self._data_service.clear()
        return response

    def set_group_membership_sync(
        self, group: dict[str, list[str]]
    ) -> InitializeUserResponse:
        """Synchronous variant of :meth:`set_group_membership`."""
        response = self._api_service.set_group_membership_sync(group)
        self._data_service.clear()
        return response

    # ------------------------------------------------------------------
    # set_working_group
    # ------------------------------------------------------------------

    async def set_working_group(
        self, working_group: dict[str, str]
    ) -> InitializeUserResponse:
        """Update the user's working group, then clear cached assignments and feature flags."""
        response = await self._api_service.set_working_group(working_group)
        self._data_service.clear()
        return response

    def set_working_group_sync(
        self, working_group: dict[str, str]
    ) -> InitializeUserResponse:
        """Synchronous variant of :meth:`set_working_group`."""
        response = self._api_service.set_working_group_sync(working_group)
        self._data_service.clear()
        return response

    # ------------------------------------------------------------------
    # get_all_experiment_conditions
    # ------------------------------------------------------------------

    async def get_all_experiment_conditions(
        self, ignore_cache: bool = False
    ) -> list[Assignment]:
        """Return all experiment assignments for this user and context.

        Results are cached after the first fetch.  Pass ``ignore_cache=True``
        to force a fresh fetch and update the cache.
        """
        return [Assignment(a, self._api_service) for a in await self._raw_assignments(ignore_cache)]

    def get_all_experiment_conditions_sync(
        self, ignore_cache: bool = False
    ) -> list[Assignment]:
        """Synchronous variant of :meth:`get_all_experiment_conditions`."""
        return [Assignment(a, self._api_service) for a in self._raw_assignments_sync(ignore_cache)]

    # ------------------------------------------------------------------
    # get_decision_point_assignment
    # ------------------------------------------------------------------

    async def get_decision_point_assignment(
        self, site: str, target: str | None = ""
    ) -> Assignment | None:
        """Return the :class:`Assignment` for a specific decision point.

        Fetches all experiment conditions first if the cache is cold.
        Returns ``None`` when no experiment is running at this decision point.
        """
        # look up in the list this call fetched rather than the cache, which may have been invalidated meanwhile
        return self._assignment_in(await self._raw_assignments(ignore_cache=False), site, target)

    def get_decision_point_assignment_sync(
        self, site: str, target: str | None = ""
    ) -> Assignment | None:
        """Synchronous variant of :meth:`get_decision_point_assignment`."""
        return self._assignment_in(self._raw_assignments_sync(ignore_cache=False), site, target)

    # ------------------------------------------------------------------
    # mark_decision_point
    # ------------------------------------------------------------------

    async def mark_decision_point(
        self,
        condition: str | None,
        status: MarkedDecisionPointStatus,
        site: str,
        target: str | None = "",
        uniquifier: str = "",
        client_error: str = "",
    ) -> MarkDecisionPointResponse:
        """Record that the user encountered a decision point.

        On success, rotates cached assignments that belong to the returned
        experiment id so successive within-subjects marks cycle in order.
        """
        if self._data_service.get_all_assignments() is None:
            await self.get_all_experiment_conditions()
        response = await self._api_service.mark_decision_point(
            **self._mark_request(condition, status, site, target, uniquifier, client_error)
        )
        self._rotate_after_mark(response)
        return response

    def mark_decision_point_sync(
        self,
        condition: str | None,
        status: MarkedDecisionPointStatus,
        site: str,
        target: str | None = "",
        uniquifier: str = "",
        client_error: str = "",
    ) -> MarkDecisionPointResponse:
        """Synchronous variant of :meth:`mark_decision_point`."""
        if self._data_service.get_all_assignments() is None:
            self.get_all_experiment_conditions_sync()
        response = self._api_service.mark_decision_point_sync(
            **self._mark_request(condition, status, site, target, uniquifier, client_error)
        )
        self._rotate_after_mark(response)
        return response

    # ------------------------------------------------------------------
    # get_all_feature_flags
    # ------------------------------------------------------------------

    async def get_all_feature_flags(
        self, ignore_cache: bool = False
    ) -> list[FeatureFlag]:
        """Return all feature flags active for this user and context.

        Results are cached after the first fetch.  Pass ``ignore_cache=True``
        to force a fresh fetch.
        """
        return [FeatureFlag(key=k) for k in await self._feature_flag_keys(ignore_cache)]

    def get_all_feature_flags_sync(
        self, ignore_cache: bool = False
    ) -> list[FeatureFlag]:
        """Synchronous variant of :meth:`get_all_feature_flags`."""
        return [FeatureFlag(key=k) for k in self._feature_flag_keys_sync(ignore_cache)]

    # ------------------------------------------------------------------
    # has_feature_flag
    # ------------------------------------------------------------------

    async def has_feature_flag(self, key: str) -> bool:
        """Return ``True`` if the named feature flag is active for this user.

        Fetches all feature flags first if the cache is cold.
        """
        # check the keys this call fetched rather than the cache, which may have been invalidated meanwhile
        return key in await self._feature_flag_keys(ignore_cache=False)

    def has_feature_flag_sync(self, key: str) -> bool:
        """Synchronous variant of :meth:`has_feature_flag`."""
        return key in self._feature_flag_keys_sync(ignore_cache=False)

    # ------------------------------------------------------------------
    # log
    # ------------------------------------------------------------------

    async def log(self, metrics: list[LogInput]) -> list[LogEventResponse]:
        """Send outcome metric events to UpGrade."""
        return await self._api_service.log(metrics)

    def log_sync(self, metrics: list[LogInput]) -> list[LogEventResponse]:
        """Synchronous variant of :meth:`log`."""
        return self._api_service.log_sync(metrics)

    # ------------------------------------------------------------------
    # set_alt_user_ids
    # ------------------------------------------------------------------

    async def set_alt_user_ids(self, aliases: list[str]) -> UserAliasResponse:
        """Register alternate identifiers for this user."""
        return await self._api_service.set_alt_user_ids(aliases)

    def set_alt_user_ids_sync(self, aliases: list[str]) -> UserAliasResponse:
        """Synchronous variant of :meth:`set_alt_user_ids`."""
        return self._api_service.set_alt_user_ids_sync(aliases)

    # ------------------------------------------------------------------
    # send_reward
    # ------------------------------------------------------------------

    async def send_reward(
        self,
        reward_value: BinaryRewardValue,
        experiment_id: str | None = None,
        context: str | None = None,
        decision_point: dict[str, str] | None = None,
        await_result: bool = False,
    ) -> SendRewardResponse:
        """Send a binary reward signal for an adaptive experiment.

        By default, returns an ``accepted`` receipt before processing finishes.
        Pass ``await_result=True`` to wait for a ``processed`` response instead.
        A reward that cannot be recorded then raises ``UpgradeApiError`` (HTTP 409).
        """
        return await self._api_service.send_reward(
            reward_value=reward_value,
            experiment_id=experiment_id,
            context=context,
            decision_point=decision_point,
            await_result=await_result,
        )

    def send_reward_sync(
        self,
        reward_value: BinaryRewardValue,
        experiment_id: str | None = None,
        context: str | None = None,
        decision_point: dict[str, str] | None = None,
        await_result: bool = False,
    ) -> SendRewardResponse:
        """Synchronous variant of :meth:`send_reward`."""
        return self._api_service.send_reward_sync(
            reward_value=reward_value,
            experiment_id=experiment_id,
            context=context,
            decision_point=decision_point,
            await_result=await_result,
        )

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    # The ``_sync`` methods always share one pooled ``httpx.Client``; release it with :meth:`close` or ``with``.
    # Async methods share a pooled ``httpx.AsyncClient`` only inside ``async with client:``, which opens and
    # closes the pool on the same event loop.  Outside it each async request uses a short-lived client, so
    # calling the client from successive ``asyncio.run()`` loops never strands a connection pool.

    def close(self) -> None:
        """Close pooled HTTP connections used by the ``_sync`` methods."""
        self._api_service.close()

    async def aclose(self) -> None:
        """Close all pooled HTTP connections (sync, and async if opened by ``async with``)."""
        await self._api_service.aclose()

    def __enter__(self) -> UpgradeClient:
        return self

    def __exit__(self, *exc_info: object) -> None:
        self.close()

    async def __aenter__(self) -> UpgradeClient:
        self._api_service.open_async_pool()
        return self

    async def __aexit__(self, *exc_info: object) -> None:
        await self.aclose()

    # ------------------------------------------------------------------
    # Internal helpers shared by the async and sync variants
    # ------------------------------------------------------------------

    async def _feature_flag_keys(self, ignore_cache: bool) -> list[str]:
        cached = None if ignore_cache else self._data_service.get_feature_flags()
        if cached is not None:
            return cached
        generation = self._data_service.get_feature_flag_generation()
        fresh = await self._api_service.get_all_feature_flags()
        # not cached if the session groups changed (or init() ran) while the request was in flight
        self._data_service.set_feature_flags(fresh, generation)
        return fresh

    def _feature_flag_keys_sync(self, ignore_cache: bool) -> list[str]:
        cached = None if ignore_cache else self._data_service.get_feature_flags()
        if cached is not None:
            return cached
        generation = self._data_service.get_feature_flag_generation()
        fresh = self._api_service.get_all_feature_flags_sync()
        self._data_service.set_feature_flags(fresh, generation)
        return fresh

    async def _raw_assignments(self, ignore_cache: bool) -> list[ExperimentAssignment]:
        cached = None if ignore_cache else self._data_service.get_all_assignments()
        if cached is not None:
            return cached
        generation = self._data_service.get_assignment_generation()
        fresh = await self._api_service.get_all_experiment_conditions()
        # not cached if the user's groups changed while the request was in flight
        self._data_service.set_assignments(fresh, generation)
        return fresh

    def _raw_assignments_sync(self, ignore_cache: bool) -> list[ExperimentAssignment]:
        cached = None if ignore_cache else self._data_service.get_all_assignments()
        if cached is not None:
            return cached
        generation = self._data_service.get_assignment_generation()
        fresh = self._api_service.get_all_experiment_conditions_sync()
        self._data_service.set_assignments(fresh, generation)
        return fresh

    def _assignment_in(
        self, assignments: list[ExperimentAssignment], site: str, target: str | None
    ) -> Assignment | None:
        raw = DataService.find_assignment(assignments, site, target)
        return Assignment(raw, self._api_service) if raw is not None else None

    def _mark_request(
        self,
        condition: str | None,
        status: MarkedDecisionPointStatus,
        site: str,
        target: str | None,
        uniquifier: str,
        client_error: str,
    ) -> dict[str, Any]:
        """Build mark kwargs, filling experiment metadata from the cached assignment when available."""
        experiment_id: str | None = None
        condition_id: str | None = None
        experiment_type = None
        factor_dict: dict[str, Any] | None = None

        cached = self._data_service.get_assignment(site, target)
        if cached is not None:
            first = cached.assignedCondition[0] if cached.assignedCondition else None
            experiment_id = first.experimentId if first else None
            condition_id = first.id if first else None
            experiment_type = cached.experimentType
            factor_entry = cached.assignedFactor[0] if cached.assignedFactor else None
            if factor_entry:
                factor_dict = {k: v.model_dump() for k, v in factor_entry.items()}

        return {
            "site": site,
            "target": target or "",
            "condition_code": condition,
            "status": status,
            "experiment_type": experiment_type,
            "experiment_id": experiment_id,
            "condition_id": condition_id,
            "assigned_factor": factor_dict,
            "uniquifier": uniquifier or None,
            "client_error": client_error or None,
        }

    def _rotate_after_mark(self, response: MarkDecisionPointResponse) -> None:
        """Rotate cached assignments for the marked experiment so within-subjects marks cycle in order."""
        if response.experimentId:
            self._data_service.rotate_assignments_by_experiment_id(response.experimentId)
