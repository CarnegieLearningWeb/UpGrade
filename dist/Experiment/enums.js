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
//# sourceMappingURL=enums.js.map