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
    site: str | None = None
    target: str | None = None


class MarkDecisionPointCondition(BaseModel):
    conditionCode: str
    experimentId: str | None = None


class MarkDecisionPointData(BaseModel):
    site: str
    target: str
    assignedCondition: MarkDecisionPointCondition


class MarkDecisionPointRequest(BaseModel):
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


class DecisionPointRef(BaseModel):
    site: str
    target: str


class SendRewardRequest(BaseModel):
    rewardValue: BinaryRewardValue
    experimentId: str | None = None
    context: str | None = None
    decisionPoint: DecisionPointRef | None = None
