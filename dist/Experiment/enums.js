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
    EXPERIMENT_STATE["PREVIEW"] = "preview";
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
    SERVER_ERROR["QUERY_FAILED"] = "Query Failed";
    SERVER_ERROR["REPORTED_ERROR"] = "Error reported from client";
    SERVER_ERROR["EXPERIMENT_USER_NOT_DEFINED"] = "Experiment user not defined";
    SERVER_ERROR["EXPERIMENT_USER_GROUP_NOT_DEFINED"] = "Experiment user group not defined";
    SERVER_ERROR["WORKING_GROUP_NOT_SUBSET_OF_GROUP"] = "Working group is not a subset of user group";
})(SERVER_ERROR = exports.SERVER_ERROR || (exports.SERVER_ERROR = {}));
var EXPERIMENT_LOG_TYPE;
(function (EXPERIMENT_LOG_TYPE) {
    EXPERIMENT_LOG_TYPE["EXPERIMENT_CREATED"] = "experimentCreated";
    EXPERIMENT_LOG_TYPE["EXPERIMENT_UPDATED"] = "experimentUpdated";
    EXPERIMENT_LOG_TYPE["EXPERIMENT_STATE_CHANGED"] = "experimentStateChanged";
    EXPERIMENT_LOG_TYPE["EXPERIMENT_DELETED"] = "experimentDeleted";
})(EXPERIMENT_LOG_TYPE = exports.EXPERIMENT_LOG_TYPE || (exports.EXPERIMENT_LOG_TYPE = {}));
var SEARCH_KEY;
(function (SEARCH_KEY) {
    SEARCH_KEY["ALL"] = "all";
    SEARCH_KEY["NAME"] = "name";
    SEARCH_KEY["STATUS"] = "status";
    SEARCH_KEY["TAG"] = "tag";
})(SEARCH_KEY = exports.SEARCH_KEY || (exports.SEARCH_KEY = {}));
var SORT_KEY;
(function (SORT_KEY) {
    SORT_KEY["NAME"] = "name";
    SORT_KEY["STATUS"] = "state";
    SORT_KEY["CREATED_AT"] = "createdAt";
    SORT_KEY["POST_EXPERIMENT_RULE"] = "postExperimentRule";
})(SORT_KEY = exports.SORT_KEY || (exports.SORT_KEY = {}));
var SORT_AS;
(function (SORT_AS) {
    SORT_AS["ASCENDING"] = "ASC";
    SORT_AS["DESCENDING"] = "DESC";
})(SORT_AS = exports.SORT_AS || (exports.SORT_AS = {}));
//# sourceMappingURL=enums.js.map