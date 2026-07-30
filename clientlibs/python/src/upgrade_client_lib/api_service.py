"""ApiService — maps library operations to HTTP endpoints."""

from __future__ import annotations

from typing import Any

import httpx

from upgrade_client_lib.exceptions import UpgradeApiError
from upgrade_client_lib.types.enums import BinaryRewardValue, ExperimentType, MarkedDecisionPointStatus
from upgrade_client_lib.types.requests import LogInput
from upgrade_client_lib.types.responses import (
    ExperimentAssignment,
    InitializeUserResponse,
    LogEventResponse,
    MarkDecisionPointResponse,
    SendRewardResponse,
    UserAliasResponse,
)

_API_VERSION = "v6"


class ApiService:
    """Low-level HTTP client for the UpGrade v6 API.

    Each operation is available in both async and sync variants.  The async
    variants use ``httpx.AsyncClient``; the sync variants use ``httpx.Client``.
    Both raise :class:`~upgrade_client_lib.exceptions.UpgradeApiError` on
    non-2xx responses.
    """

    def __init__(
        self,
        host_url: str,
        user_id: str,
        context: str,
        token: str = "",
        client_session_id: str = "",
    ) -> None:
        self._host_url = host_url.rstrip("/")
        self._user_id = user_id
        self._context = context
        self._token = token
        self._client_session_id = client_session_id

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _url(self, path: str) -> str:
        return f"{self._host_url}/api/{_API_VERSION}/{path}"

    def _headers(self) -> dict[str, str]:
        headers: dict[str, str] = {
            "Content-Type": "application/json",
            "Session-Id": self._client_session_id,
            "User-Id": self._user_id,
        }
        if self._token:
            headers["Authorization"] = f"Bearer {self._token}"
        return headers

    @staticmethod
    def _raise_for_status(response: httpx.Response) -> None:
        if response.is_error:
            raise UpgradeApiError(
                status_code=response.status_code,
                message=f"UpGrade API error {response.status_code}",
                response_body=response.text,
            )

    async def _post_async(self, path: str, body: dict[str, Any]) -> Any:
        async with httpx.AsyncClient() as client:
            response = await client.post(self._url(path), json=body, headers=self._headers())
        self._raise_for_status(response)
        return response.json()

    async def _patch_async(self, path: str, body: dict[str, Any]) -> Any:
        async with httpx.AsyncClient() as client:
            response = await client.patch(self._url(path), json=body, headers=self._headers())
        self._raise_for_status(response)
        return response.json()

    def _post_sync(self, path: str, body: dict[str, Any]) -> Any:
        with httpx.Client() as client:
            response = client.post(self._url(path), json=body, headers=self._headers())
        self._raise_for_status(response)
        return response.json()

    def _patch_sync(self, path: str, body: dict[str, Any]) -> Any:
        with httpx.Client() as client:
            response = client.patch(self._url(path), json=body, headers=self._headers())
        self._raise_for_status(response)
        return response.json()

    # ------------------------------------------------------------------
    # init  POST /api/v6/init
    # ------------------------------------------------------------------

    async def init_user(
        self,
        group: dict[str, list[str]] | None = None,
        working_group: dict[str, str] | None = None,
    ) -> InitializeUserResponse:
        body: dict[str, Any] = {}
        if group is not None:
            body["group"] = group
        if working_group is not None:
            body["workingGroup"] = working_group
        data = await self._post_async("init", body)
        return InitializeUserResponse.model_validate(data)

    def init_user_sync(
        self,
        group: dict[str, list[str]] | None = None,
        working_group: dict[str, str] | None = None,
    ) -> InitializeUserResponse:
        body: dict[str, Any] = {}
        if group is not None:
            body["group"] = group
        if working_group is not None:
            body["workingGroup"] = working_group
        data = self._post_sync("init", body)
        return InitializeUserResponse.model_validate(data)

    # ------------------------------------------------------------------
    # set_group_membership  PATCH /api/v6/groupmembership
    # ------------------------------------------------------------------

    async def set_group_membership(self, group: dict[str, list[str]]) -> InitializeUserResponse:
        data = await self._patch_async("groupmembership", {"group": group})
        return InitializeUserResponse.model_validate(data)

    def set_group_membership_sync(self, group: dict[str, list[str]]) -> InitializeUserResponse:
        data = self._patch_sync("groupmembership", {"group": group})
        return InitializeUserResponse.model_validate(data)

    # ------------------------------------------------------------------
    # set_working_group  PATCH /api/v6/workinggroup
    # ------------------------------------------------------------------

    async def set_working_group(self, working_group: dict[str, str]) -> InitializeUserResponse:
        data = await self._patch_async("workinggroup", {"workingGroup": working_group})
        return InitializeUserResponse.model_validate(data)

    def set_working_group_sync(self, working_group: dict[str, str]) -> InitializeUserResponse:
        data = self._patch_sync("workinggroup", {"workingGroup": working_group})
        return InitializeUserResponse.model_validate(data)

    # ------------------------------------------------------------------
    # get_all_experiment_conditions  POST /api/v6/assign
    # ------------------------------------------------------------------

    async def get_all_experiment_conditions(
        self, site: str | None = None, target: str | None = None
    ) -> list[ExperimentAssignment]:
        body: dict[str, Any] = {"context": self._context, "userId": self._user_id}
        if site is not None:
            body["decisionPoint"] = {"site": site, "target": target if target is not None else ""}
        data = await self._post_async("assign", body)
        return [ExperimentAssignment.model_validate(item) for item in data]

    def get_all_experiment_conditions_sync(
        self, site: str | None = None, target: str | None = None
    ) -> list[ExperimentAssignment]:
        body: dict[str, Any] = {"context": self._context, "userId": self._user_id}
        if site is not None:
            body["decisionPoint"] = {"site": site, "target": target if target is not None else ""}
        data = self._post_sync("assign", body)
        return [ExperimentAssignment.model_validate(item) for item in data]

    # ------------------------------------------------------------------
    # mark_decision_point  POST /api/v6/mark
    # ------------------------------------------------------------------

    async def mark_decision_point(
        self,
        site: str,
        target: str | None,
        condition_code: str,
        status: MarkedDecisionPointStatus,
        experiment_type: ExperimentType | None = None,
        experiment_id: str | None = None,
        condition_id: str | None = None,
        assigned_factor: dict[str, Any] | None = None,
        uniquifier: str | None = None,
        client_error: str | None = None,
    ) -> MarkDecisionPointResponse:
        body = self._build_mark_body(
            site,
            target,
            condition_code,
            status,
            experiment_type,
            experiment_id,
            condition_id,
            assigned_factor,
            uniquifier,
            client_error,
        )
        data = await self._post_async("mark", body)
        return MarkDecisionPointResponse.model_validate(data)

    def mark_decision_point_sync(
        self,
        site: str,
        target: str | None,
        condition_code: str,
        status: MarkedDecisionPointStatus,
        experiment_type: ExperimentType | None = None,
        experiment_id: str | None = None,
        condition_id: str | None = None,
        assigned_factor: dict[str, Any] | None = None,
        uniquifier: str | None = None,
        client_error: str | None = None,
    ) -> MarkDecisionPointResponse:
        body = self._build_mark_body(
            site,
            target,
            condition_code,
            status,
            experiment_type,
            experiment_id,
            condition_id,
            assigned_factor,
            uniquifier,
            client_error,
        )
        data = self._post_sync("mark", body)
        return MarkDecisionPointResponse.model_validate(data)

    @staticmethod
    def _build_mark_body(
        site: str,
        target: str | None,
        condition_code: str,
        status: MarkedDecisionPointStatus,
        experiment_type: ExperimentType | None,
        experiment_id: str | None,
        condition_id: str | None,
        assigned_factor: dict[str, Any] | None,
        uniquifier: str | None,
        client_error: str | None,
    ) -> dict[str, Any]:
        assigned_condition: dict[str, Any] = {"conditionCode": condition_code}
        if experiment_id is not None:
            assigned_condition["experimentId"] = experiment_id
        if condition_id is not None:
            assigned_condition["id"] = condition_id

        mark_data: dict[str, Any] = {
            "site": site,
            "target": target,
            "assignedCondition": assigned_condition,
        }
        if experiment_type is not None:
            mark_data["experimentType"] = experiment_type.value
        if assigned_factor is not None:
            mark_data["assignedFactor"] = assigned_factor

        body: dict[str, Any] = {"status": status.value, "data": mark_data}
        if uniquifier is not None:
            body["uniquifier"] = uniquifier
        if client_error is not None:
            body["clientError"] = client_error
        return body

    # ------------------------------------------------------------------
    # get_all_feature_flags  POST /api/v6/featureflag
    # ------------------------------------------------------------------

    async def get_all_feature_flags(self) -> list[str]:
        data = await self._post_async("featureflag", {"context": self._context, "userId": self._user_id})
        return list(data)

    def get_all_feature_flags_sync(self) -> list[str]:
        data = self._post_sync("featureflag", {"context": self._context, "userId": self._user_id})
        return list(data)

    # ------------------------------------------------------------------
    # log  POST /api/v6/log
    # ------------------------------------------------------------------

    async def log(self, log_inputs: list[LogInput]) -> list[LogEventResponse]:
        body = {"userId": self._user_id, "value": [item.model_dump() for item in log_inputs]}
        data = await self._post_async("log", body)
        return [LogEventResponse.model_validate(item) for item in data]

    def log_sync(self, log_inputs: list[LogInput]) -> list[LogEventResponse]:
        body = {"userId": self._user_id, "value": [item.model_dump() for item in log_inputs]}
        data = self._post_sync("log", body)
        return [LogEventResponse.model_validate(item) for item in data]

    # ------------------------------------------------------------------
    # set_alt_user_ids  PATCH /api/v6/useraliases
    # ------------------------------------------------------------------

    async def set_alt_user_ids(self, aliases: list[str]) -> UserAliasResponse:
        body = {"userId": self._user_id, "aliases": aliases}
        data = await self._patch_async("useraliases", body)
        return UserAliasResponse.model_validate(data)

    def set_alt_user_ids_sync(self, aliases: list[str]) -> UserAliasResponse:
        body = {"userId": self._user_id, "aliases": aliases}
        data = self._patch_sync("useraliases", body)
        return UserAliasResponse.model_validate(data)

    # ------------------------------------------------------------------
    # send_reward  POST /api/v6/reward
    # ------------------------------------------------------------------

    async def send_reward(
        self,
        reward_value: BinaryRewardValue,
        experiment_id: str | None = None,
        context: str | None = None,
        decision_point: dict[str, str] | None = None,
    ) -> SendRewardResponse:
        body = self._build_reward_body(reward_value, experiment_id, context, decision_point)
        data = await self._post_async("reward", body)
        return SendRewardResponse.model_validate(data)

    def send_reward_sync(
        self,
        reward_value: BinaryRewardValue,
        experiment_id: str | None = None,
        context: str | None = None,
        decision_point: dict[str, str] | None = None,
    ) -> SendRewardResponse:
        body = self._build_reward_body(reward_value, experiment_id, context, decision_point)
        data = self._post_sync("reward", body)
        return SendRewardResponse.model_validate(data)

    @staticmethod
    def _build_reward_body(
        reward_value: BinaryRewardValue,
        experiment_id: str | None,
        context: str | None,
        decision_point: dict[str, str] | None,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {"rewardValue": reward_value.value}
        if experiment_id is not None:
            body["experimentId"] = experiment_id
        if context is not None:
            body["context"] = context
        if decision_point is not None:
            body["decisionPoint"] = decision_point
        return body
