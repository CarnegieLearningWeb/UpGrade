"""UpgradeClient — primary public API class."""

from __future__ import annotations

import asyncio
import uuid
from typing import Any

from upgrade_client_lib.api_service import ApiService
from upgrade_client_lib.assignment import Assignment
from upgrade_client_lib.data_service import DataService
from upgrade_client_lib.types.enums import BinaryRewardValue, MarkedDecisionPointStatus
from upgrade_client_lib.types.requests import LogInput
from upgrade_client_lib.types.responses import (
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
        )

    # ------------------------------------------------------------------
    # init
    # ------------------------------------------------------------------

    async def init(
        self,
        group: dict[str, list[str]] | None = None,
        working_group: dict[str, str] | None = None,
    ) -> InitializeUserResponse:
        """Initialize (or re-initialize) the user and clear the local cache."""
        self._data_service.clear()
        return await self._api_service.init_user(group=group, working_group=working_group)

    def init_sync(
        self,
        group: dict[str, list[str]] | None = None,
        working_group: dict[str, str] | None = None,
    ) -> InitializeUserResponse:
        """Synchronous variant of :meth:`init`."""
        return asyncio.run(self.init(group=group, working_group=working_group))

    # ------------------------------------------------------------------
    # set_group_membership
    # ------------------------------------------------------------------

    async def set_group_membership(
        self, group: dict[str, list[str]]
    ) -> InitializeUserResponse:
        """Update the user's group membership."""
        return await self._api_service.set_group_membership(group)

    def set_group_membership_sync(
        self, group: dict[str, list[str]]
    ) -> InitializeUserResponse:
        """Synchronous variant of :meth:`set_group_membership`."""
        return asyncio.run(self.set_group_membership(group))

    # ------------------------------------------------------------------
    # set_working_group
    # ------------------------------------------------------------------

    async def set_working_group(
        self, working_group: dict[str, str]
    ) -> InitializeUserResponse:
        """Update the user's working group."""
        return await self._api_service.set_working_group(working_group)

    def set_working_group_sync(
        self, working_group: dict[str, str]
    ) -> InitializeUserResponse:
        """Synchronous variant of :meth:`set_working_group`."""
        return asyncio.run(self.set_working_group(working_group))

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
        cached = None if ignore_cache else self._data_service.get_all_assignments()
        if cached is None:
            fresh = await self._api_service.get_all_experiment_conditions()
            self._data_service.set_assignments(fresh)
            cached = fresh
        return [Assignment(a, self._api_service) for a in cached]

    def get_all_experiment_conditions_sync(
        self, ignore_cache: bool = False
    ) -> list[Assignment]:
        """Synchronous variant of :meth:`get_all_experiment_conditions`."""
        return asyncio.run(self.get_all_experiment_conditions(ignore_cache=ignore_cache))

    # ------------------------------------------------------------------
    # get_decision_point_assignment
    # ------------------------------------------------------------------

    async def get_decision_point_assignment(
        self, site: str, target: str = ""
    ) -> Assignment | None:
        """Return the :class:`Assignment` for a specific decision point.

        Fetches all experiment conditions first if the cache is cold.
        Returns ``None`` when no experiment is running at this decision point.
        """
        if self._data_service.get_all_assignments() is None:
            await self.get_all_experiment_conditions()
        raw = self._data_service.get_assignment(site, target)
        if raw is None:
            return None
        return Assignment(raw, self._api_service)

    def get_decision_point_assignment_sync(
        self, site: str, target: str = ""
    ) -> Assignment | None:
        """Synchronous variant of :meth:`get_decision_point_assignment`."""
        return asyncio.run(self.get_decision_point_assignment(site, target))

    # ------------------------------------------------------------------
    # mark_decision_point
    # ------------------------------------------------------------------

    async def mark_decision_point(
        self,
        site: str,
        target: str,
        condition: str,
        status: MarkedDecisionPointStatus,
        uniquifier: str = "",
        client_error: str = "",
    ) -> MarkDecisionPointResponse:
        """Record that the user encountered a decision point.

        Rotates the cached assignment's condition/factor lists so that
        successive within-subjects marks cycle through conditions in order.
        """
        if self._data_service.get_all_assignments() is None:
            await self.get_all_experiment_conditions()

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
            self._data_service.rotate_assignment(cached)

        return await self._api_service.mark_decision_point(
            site=site,
            target=target,
            condition_code=condition,
            status=status,
            experiment_type=experiment_type,
            experiment_id=experiment_id,
            condition_id=condition_id,
            assigned_factor=factor_dict,
            uniquifier=uniquifier or None,
            client_error=client_error or None,
        )

    def mark_decision_point_sync(
        self,
        site: str,
        target: str,
        condition: str,
        status: MarkedDecisionPointStatus,
        uniquifier: str = "",
        client_error: str = "",
    ) -> MarkDecisionPointResponse:
        """Synchronous variant of :meth:`mark_decision_point`."""
        return asyncio.run(
            self.mark_decision_point(site, target, condition, status, uniquifier, client_error)
        )

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
        cached_keys = None if ignore_cache else self._data_service.get_feature_flags()
        if cached_keys is None:
            fresh_keys = await self._api_service.get_all_feature_flags()
            self._data_service.set_feature_flags(fresh_keys)
            cached_keys = fresh_keys
        return [FeatureFlag(key=k) for k in cached_keys]

    def get_all_feature_flags_sync(
        self, ignore_cache: bool = False
    ) -> list[FeatureFlag]:
        """Synchronous variant of :meth:`get_all_feature_flags`."""
        return asyncio.run(self.get_all_feature_flags(ignore_cache=ignore_cache))

    # ------------------------------------------------------------------
    # has_feature_flag
    # ------------------------------------------------------------------

    async def has_feature_flag(self, key: str) -> bool:
        """Return ``True`` if the named feature flag is active for this user.

        Fetches all feature flags first if the cache is cold.
        """
        if self._data_service.get_feature_flags() is None:
            await self.get_all_feature_flags()
        return self._data_service.has_feature_flag(key)

    def has_feature_flag_sync(self, key: str) -> bool:
        """Synchronous variant of :meth:`has_feature_flag`."""
        return asyncio.run(self.has_feature_flag(key))

    # ------------------------------------------------------------------
    # log
    # ------------------------------------------------------------------

    async def log(self, metrics: list[LogInput]) -> list[LogEventResponse]:
        """Send outcome metric events to UpGrade."""
        return await self._api_service.log(metrics)

    def log_sync(self, metrics: list[LogInput]) -> list[LogEventResponse]:
        """Synchronous variant of :meth:`log`."""
        return asyncio.run(self.log(metrics))

    # ------------------------------------------------------------------
    # set_alt_user_ids
    # ------------------------------------------------------------------

    async def set_alt_user_ids(self, aliases: list[str]) -> UserAliasResponse:
        """Register alternate identifiers for this user."""
        return await self._api_service.set_alt_user_ids(aliases)

    def set_alt_user_ids_sync(self, aliases: list[str]) -> UserAliasResponse:
        """Synchronous variant of :meth:`set_alt_user_ids`."""
        return asyncio.run(self.set_alt_user_ids(aliases))

    # ------------------------------------------------------------------
    # send_reward
    # ------------------------------------------------------------------

    async def send_reward(
        self,
        reward_value: BinaryRewardValue,
        experiment_id: str | None = None,
        context: str | None = None,
        decision_point: dict[str, str] | None = None,
    ) -> SendRewardResponse:
        """Send a binary reward signal for an adaptive (Mooclet) experiment."""
        return await self._api_service.send_reward(
            reward_value=reward_value,
            experiment_id=experiment_id,
            context=context,
            decision_point=decision_point,
        )

    def send_reward_sync(
        self,
        reward_value: BinaryRewardValue,
        experiment_id: str | None = None,
        context: str | None = None,
        decision_point: dict[str, str] | None = None,
    ) -> SendRewardResponse:
        """Synchronous variant of :meth:`send_reward`."""
        return asyncio.run(
            self.send_reward(reward_value, experiment_id, context, decision_point)
        )
