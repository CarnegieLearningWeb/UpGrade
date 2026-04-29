"""Pydantic response models for the UpGrade client API."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel

from upgrade_client_lib.types.enums import BinaryRewardValue, ExperimentType, PayloadType


class InitializeUserResponse(BaseModel):
    id: str
    group: dict[str, list[str]] | None = None
    workingGroup: dict[str, str] | None = None


class Payload(BaseModel):
    type: PayloadType
    value: str


class AssignedCondition(BaseModel):
    id: str
    conditionCode: str
    payload: Payload | None = None
    experimentId: str | None = None


class AssignedFactor(BaseModel):
    level: str
    payload: Payload | None = None


class ExperimentAssignment(BaseModel):
    site: str
    target: str | None = None
    experimentType: ExperimentType
    assignedCondition: list[AssignedCondition]
    assignedFactor: list[dict[str, AssignedFactor]] | None = None


class FlagVariation(BaseModel):
    id: str
    value: str
    name: str
    description: str
    defaultVariation: list[bool] = []


class FeatureFlag(BaseModel):
    key: str
    status: bool | None = None
    variationValue: str | None = None


class MarkDecisionPointResponse(BaseModel):
    id: str | None = None
    userId: str
    site: str
    target: str
    experimentId: str | None = None
    condition: str | None = None


class LogEventResponse(BaseModel):
    id: int
    uniquifier: str
    timeStamp: str
    data: Any


class UserAliasResponse(BaseModel):
    userId: str
    aliases: list[str]


class RewardRequest(BaseModel):
    rewardValue: BinaryRewardValue
    experimentId: str | None = None
    context: str | None = None
    decisionPoint: dict[str, str] | None = None


class RewardDetails(BaseModel):
    variable: str
    value: float
    mooclet: int
    version: int
    learner: str


class SendRewardResponse(BaseModel):
    message: str
    request: RewardRequest
    reward: RewardDetails


class ErrorResponse(BaseModel):
    message: str
    httpStatusCode: int | None = None
    type: str | None = None
