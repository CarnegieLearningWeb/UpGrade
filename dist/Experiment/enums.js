"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CONSISTENCY_RULE;
(function (CONSISTENCY_RULE) {
    CONSISTENCY_RULE["INDIVIDUAL"] = "individual";
    CONSISTENCY_RULE["EXPERIMENT"] = "experiment";
    CONSISTENCY_RULE["GROUP"] = "group";
})(CONSISTENCY_RULE = exports.CONSISTENCY_RULE || (exports.CONSISTENCY_RULE = {}));
var ASSIGNMENT_UNIT;
(function (ASSIGNMENT_UNIT) {
    ASSIGNMENT_UNIT["INDIVIDUAL"] = "individual";
    ASSIGNMENT_UNIT["GROUP"] = "group";
})(ASSIGNMENT_UNIT = exports.ASSIGNMENT_UNIT || (exports.ASSIGNMENT_UNIT = {}));
var POST_EXPERIMENT_RULE;
(function (POST_EXPERIMENT_RULE) {
    POST_EXPERIMENT_RULE["CONTINUE"] = "continue";
    POST_EXPERIMENT_RULE["REVERT"] = "revert";
})(POST_EXPERIMENT_RULE = exports.POST_EXPERIMENT_RULE || (exports.POST_EXPERIMENT_RULE = {}));
var EXPERIMENT_STATE;
(function (EXPERIMENT_STATE) {
    EXPERIMENT_STATE["INACTIVE"] = "inactive";
    EXPERIMENT_STATE["DEMO"] = "demo";
    EXPERIMENT_STATE["SCHEDULED"] = "scheduled";
    EXPERIMENT_STATE["ENROLLING"] = "enrolling";
    EXPERIMENT_STATE["ENROLLMENT_COMPLETE"] = "enrollmentComplete";
    EXPERIMENT_STATE["CANCELLED"] = "cancelled";
})(EXPERIMENT_STATE = exports.EXPERIMENT_STATE || (exports.EXPERIMENT_STATE = {}));
var SERVER_ERROR;
(function (SERVER_ERROR) {
    SERVER_ERROR["DB_UNREACHABLE"] = "Database not reachable";
    SERVER_ERROR["DB_AUTH_FAIL"] = "Database auth fail";
    SERVER_ERROR["ASSIGNMENT_ERROR"] = "Error in the assignment algorithm";
    SERVER_ERROR["MISSING_PARAMS"] = "Parameter missing in the client request";
    SERVER_ERROR["INCORRECT_PARAM_FORMAT"] = "Parameter not in the correct format";
    SERVER_ERROR["USER_NOT_FOUND"] = "User ID not found";
})(SERVER_ERROR = exports.SERVER_ERROR || (exports.SERVER_ERROR = {}));
var EXPERIMENT_LOG_TYPE;
(function (EXPERIMENT_LOG_TYPE) {
    EXPERIMENT_LOG_TYPE["EXPERIMENT_CREATED"] = "experimentCreated";
    EXPERIMENT_LOG_TYPE["EXPERIMENT_UPDATED"] = "experimentUpdated";
    EXPERIMENT_LOG_TYPE["EXPERIMENT_STATE_CHANGED"] = "experimentStateChanged";
})(EXPERIMENT_LOG_TYPE = exports.EXPERIMENT_LOG_TYPE || (exports.EXPERIMENT_LOG_TYPE = {}));
//# sourceMappingURL=enums.js.map