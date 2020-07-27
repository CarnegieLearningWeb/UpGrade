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
    SERVER_ERROR["INVALID_TOKEN"] = "Invalid token";
    SERVER_ERROR["TOKEN_NOT_PRESENT"] = "Token is not present in request";
    SERVER_ERROR["MIGRATION_ERROR"] = "Error in migration";
    SERVER_ERROR["EMAIL_SEND_ERROR"] = "Email send error";
})(SERVER_ERROR = exports.SERVER_ERROR || (exports.SERVER_ERROR = {}));
var ENROLLMENT_CODE;
(function (ENROLLMENT_CODE) {
    ENROLLMENT_CODE["INCLUDED"] = "Student included in experiment";
    ENROLLMENT_CODE["PRIOR_EXPERIMENT_ENROLLING"] = "Student reached experiment point prior to experiment enrolling";
    ENROLLMENT_CODE["STUDENT_EXCLUDED"] = "Student was on exclusion list";
    ENROLLMENT_CODE["GROUP_EXCLUDED"] = "GROUP was on exclusion list";
})(ENROLLMENT_CODE = exports.ENROLLMENT_CODE || (exports.ENROLLMENT_CODE = {}));
var EXPERIMENT_LOG_TYPE;
(function (EXPERIMENT_LOG_TYPE) {
    EXPERIMENT_LOG_TYPE["EXPERIMENT_CREATED"] = "experimentCreated";
    EXPERIMENT_LOG_TYPE["EXPERIMENT_UPDATED"] = "experimentUpdated";
    EXPERIMENT_LOG_TYPE["EXPERIMENT_STATE_CHANGED"] = "experimentStateChanged";
    EXPERIMENT_LOG_TYPE["EXPERIMENT_DELETED"] = "experimentDeleted";
})(EXPERIMENT_LOG_TYPE = exports.EXPERIMENT_LOG_TYPE || (exports.EXPERIMENT_LOG_TYPE = {}));
var EXPERIMENT_SEARCH_KEY;
(function (EXPERIMENT_SEARCH_KEY) {
    EXPERIMENT_SEARCH_KEY["ALL"] = "all";
    EXPERIMENT_SEARCH_KEY["NAME"] = "name";
    EXPERIMENT_SEARCH_KEY["STATUS"] = "status";
    EXPERIMENT_SEARCH_KEY["TAG"] = "tag";
    EXPERIMENT_SEARCH_KEY["CONTEXT"] = "context";
})(EXPERIMENT_SEARCH_KEY = exports.EXPERIMENT_SEARCH_KEY || (exports.EXPERIMENT_SEARCH_KEY = {}));
var EXPERIMENT_SORT_KEY;
(function (EXPERIMENT_SORT_KEY) {
    EXPERIMENT_SORT_KEY["NAME"] = "name";
    EXPERIMENT_SORT_KEY["STATUS"] = "state";
    EXPERIMENT_SORT_KEY["CREATED_AT"] = "createdAt";
    EXPERIMENT_SORT_KEY["POST_EXPERIMENT_RULE"] = "postExperimentRule";
})(EXPERIMENT_SORT_KEY = exports.EXPERIMENT_SORT_KEY || (exports.EXPERIMENT_SORT_KEY = {}));
var EXPERIMENT_SORT_AS;
(function (EXPERIMENT_SORT_AS) {
    EXPERIMENT_SORT_AS["ASCENDING"] = "ASC";
    EXPERIMENT_SORT_AS["DESCENDING"] = "DESC";
})(EXPERIMENT_SORT_AS = exports.EXPERIMENT_SORT_AS || (exports.EXPERIMENT_SORT_AS = {}));
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["CREATOR"] = "creator";
    UserRole["USER_MANAGER"] = "user manager";
    UserRole["READER"] = "reader";
})(UserRole = exports.UserRole || (exports.UserRole = {}));
var OPERATION_TYPES;
(function (OPERATION_TYPES) {
    OPERATION_TYPES["SUM"] = "sum";
    OPERATION_TYPES["COUNT"] = "count";
    OPERATION_TYPES["MIN"] = "min";
    OPERATION_TYPES["MAX"] = "max";
    OPERATION_TYPES["AVERAGE"] = "avg";
    OPERATION_TYPES["MODE"] = "mode";
    OPERATION_TYPES["MEDIAN"] = "median";
    OPERATION_TYPES["STDEV"] = "stddev";
    OPERATION_TYPES["PERCENTAGE"] = "percentage";
})(OPERATION_TYPES = exports.OPERATION_TYPES || (exports.OPERATION_TYPES = {}));
var IMetricMetaData;
(function (IMetricMetaData) {
    IMetricMetaData["CONTINUOUS"] = "continuous";
    IMetricMetaData["CATEGORICAL"] = "categorical";
})(IMetricMetaData = exports.IMetricMetaData || (exports.IMetricMetaData = {}));
var DATE_RANGE;
(function (DATE_RANGE) {
    DATE_RANGE["LAST_SEVEN_DAYS"] = "last_seven_days";
    DATE_RANGE["LAST_THREE_MONTHS"] = "last_three_months";
    DATE_RANGE["LAST_SIX_MONTHS"] = "last_six_months";
    DATE_RANGE["LAST_TWELVE_MONTHS"] = "last_twelve_months";
})(DATE_RANGE = exports.DATE_RANGE || (exports.DATE_RANGE = {}));
var REPEATED_MEASURE;
(function (REPEATED_MEASURE) {
    REPEATED_MEASURE["mean"] = "MEAN";
    REPEATED_MEASURE["earliest"] = "EARLIEST";
    REPEATED_MEASURE["mostRecent"] = "MOST_RECENT";
})(REPEATED_MEASURE = exports.REPEATED_MEASURE || (exports.REPEATED_MEASURE = {}));
//# sourceMappingURL=enums.js.map