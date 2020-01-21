export declare enum CONSISTENCY_RULE {
    INDIVIDUAL = "individual",
    EXPERIMENT = "experiment",
    GROUP = "group"
}
export declare enum ASSIGNMENT_UNIT {
    INDIVIDUAL = "individual",
    GROUP = "group"
}
export declare enum POST_EXPERIMENT_RULE {
    CONTINUE = "continue",
    REVERT = "revert"
}
export declare enum EXPERIMENT_STATE {
    INACTIVE = "inactive",
    DEMO = "demo",
    SCHEDULED = "scheduled",
    ENROLLING = "enrolling",
    ENROLLMENT_COMPLETE = "enrollmentComplete",
    CANCELLED = "cancelled"
}
export declare enum SERVER_ERROR {
    DB_UNREACHABLE = "Database not reachable",
    DB_AUTH_FAIL = "Database auth fail",
    ASSIGNMENT_ERROR = "Error in the assignment algorithm",
    MISSING_PARAMS = "Parameter missing in the client request",
    INCORRECT_PARAM_FORMAT = "Parameter not in the correct format",
    USER_NOT_FOUND = "User ID not found"
}
export declare enum EXPERIMENT_LOG_TYPE {
    EXPERIMENT_CREATED = "experimentCreated",
    EXPERIMENT_UPDATED = "experimentUpdated",
    EXPERIMENT_STATE_CHANGED = "experimentStateChanged"
}
