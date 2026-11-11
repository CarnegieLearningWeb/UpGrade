"""Pydantic request models for the UpGrade client API."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel

from upgrade_client_lib.types.enums import BinaryRewardValue, MarkedDecisionPointStatus


class InitializeUserRequest(BaseModel):
    id: str | None = None
    group: dict[str, list[str]] | None = None
    workingGroup: dict[str, str] | None = None


class SetGroupMembershipRequest(BaseModel):
    id: str
    group: dict[str, list[str]]


class SetWorkingGroupRequest(BaseModel):
    id: str
    workingGroup: dict[str, str]


class AssignRequest(BaseModel):
    userId: str
    context: str


class MarkDecisionPointCondition(BaseModel):
    conditionCode: str | None
    experimentId: str | None = None


class MarkDecisionPointData(BaseModel):
    site: str
    target: str
    assignedCondition: MarkDecisionPointCondition


class MarkDecisionPointRequest(BaseModel):
    context: str
    status: MarkedDecisionPointStatus
    data: MarkDecisionPointData
    uniquifier: str | None = None
    clientError: str | None = None


class LogGroupMetrics(BaseModel):
    groupClass: str
    groupKey: str
    groupUniquifier: str
    attributes: dict[str, Any]


class LogMetrics(BaseModel):
    attributes: dict[str, Any] = {}
    groupedMetrics: list[LogGroupMetrics] = []


class LogInput(BaseModel):
    timestamp: str
    metrics: LogMetrics


class LogRequest(BaseModel):
    userId: str
    value: list[LogInput]


class UserAliasRequest(BaseModel):
    userId: str
    aliases: list[str]


class FeatureFlagRequest(BaseModel):
    userId: str
    context: str


class FeatureFlagUserGroupsForSession(BaseModel):
    """Session-scoped groups for feature flag evaluation.

    ``groupsForSession`` is used for this client's feature flag requests.  When ``includeStoredUserGroups`` is
    ``True`` it is merged with the user's stored groups; when ``False`` it replaces them.  Both fields are
    required, matching the server's both-or-neither rule.
    """

    groupsForSession: dict[str, list[str]]
    includeStoredUserGroups: bool


class DecisionPointRef(BaseModel):
    site: str
    target: str


class SendRewardRequest(BaseModel):
    rewardValue: BinaryRewardValue
    experimentId: str | None = None
    context: str | None = None
    decisionPoint: DecisionPointRef | None = None
