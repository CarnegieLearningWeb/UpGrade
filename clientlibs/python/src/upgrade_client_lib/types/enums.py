"""Enums for the UpGrade client library."""

from enum import Enum


class MarkedDecisionPointStatus(str, Enum):
    CONDITION_APPLIED = "condition applied"
    CONDITION_FAILED_TO_APPLY = "condition not applied"
    NO_CONDITION_ASSIGNED = "no condition assigned"


class ExperimentType(str, Enum):
    SIMPLE = "Simple"
    FACTORIAL = "Factorial"


class PayloadType(str, Enum):
    STRING = "string"
    JSON = "json"
    CSV = "csv"


class BinaryRewardValue(str, Enum):
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"
