export enum CONSISTENCY_RULE {
  INDIVIDUAL = 'individual',
  EXPERIMENT = 'experiment',
  GROUP = 'group',
}

export enum ASSIGNMENT_UNIT {
  INDIVIDUAL = 'individual',
  GROUP = 'group',
  WITHIN_SUBJECTS = 'within-subjects',
}

export enum CONDITION_ORDER {
  RANDOM = 'random',
  RANDOM_ROUND_ROBIN = 'random round robin',
  ORDERED_ROUND_ROBIN = 'ordered round robin',
}

export enum POST_EXPERIMENT_RULE {
  CONTINUE = 'continue',
  // TO DO : Remove revert when frontend and backend integrated with assign
  REVERT = 'revert',
  ASSIGN = 'assign',
}

export enum EXPERIMENT_STATE {
  INACTIVE = 'inactive',
  PREVIEW = 'preview',
  SCHEDULED = 'scheduled',
  ENROLLING = 'enrolling',
  ENROLLMENT_COMPLETE = 'enrollmentComplete',
  CANCELLED = 'cancelled',
}

export enum SERVER_ERROR {
  DB_UNREACHABLE = 'Database not reachable',
  DB_AUTH_FAIL = 'Database auth fail',
  ASSIGNMENT_ERROR = 'Error in the assignment algorithm',
  MISSING_PARAMS = 'Parameter missing in the client request',
  INCORRECT_PARAM_FORMAT = 'Parameter not in the correct format',
  USER_NOT_FOUND = 'User ID not found',
  QUERY_FAILED = 'Query Failed',
  REPORTED_ERROR = 'Error reported from client',
  EXPERIMENT_USER_NOT_DEFINED = 'Experiment user not defined',
  EXPERIMENT_USER_GROUP_NOT_DEFINED = 'Experiment user group not defined',
  WORKING_GROUP_NOT_SUBSET_OF_GROUP = 'Working group is not a subset of user group',
  INVALID_TOKEN = 'Invalid token',
  TOKEN_NOT_PRESENT = 'Token is not present in request',
  MIGRATION_ERROR = 'Error in migration',
  EMAIL_SEND_ERROR = 'Email send error',
  CONDITION_NOT_FOUND = 'Condition not found',
  EXPERIMENT_ID_MISSING_FOR_SHARED_DECISIONPOINT = 'Experiment ID not provided for shared Decision Point',
  INVALID_EXPERIMENT_ID_FOR_SHARED_DECISIONPOINT = 'Experiment ID provided is invalid for shared Decision Point',
  UNSUPPORTED_CALIPER = 'Caliper profile or event not supported',
}

export enum MARKED_DECISION_POINT_STATUS {
  CONDITION_APPLIED = 'condition applied',
  CONDITION_FAILED_TO_APPLY = 'condition not applied',
  NO_CONDITION_ASSIGNED = 'no condition assigned',
}

export enum ENROLLMENT_CODE {
  ALGORITHMIC = 'participant enrolled via algorithm',
  GROUP_LOGIC = 'participant enrolled due to group enrollment',
}

export enum EXCLUSION_CODE {
  ERROR = 'participant excluded due to unspecified error',
  REACHED_PRIOR = 'participant reached experiment prior to experiment enrolling',
  REACHED_AFTER = 'participant reached experiment during enrollment complete',
  PARTICIPANT_ON_EXCLUSION_LIST = 'participant was on the exclusion list',
  GROUP_ON_EXCLUSION_LIST = 'participant’s group was on the exclusion list',
  EXCLUDED_DUE_TO_GROUP_LOGIC = 'participant excluded due to group assignment logic',
  NO_GROUP_SPECIFIED = 'participant excluded due to incomplete group information',
  INVALID_GROUP_OR_WORKING_GROUP = "participant's group or working group is incorrect",
  EXCLUDED_BY_CLIENT = 'participant is excluded by client',
}

export enum EXPERIMENT_LOG_TYPE {
  EXPERIMENT_CREATED = 'experimentCreated',
  EXPERIMENT_UPDATED = 'experimentUpdated',
  EXPERIMENT_STATE_CHANGED = 'experimentStateChanged',
  EXPERIMENT_DELETED = 'experimentDeleted',
  EXPERIMENT_DATA_EXPORTED = 'experimentDataExported',
  EXPERIMENT_DATA_REQUESTED = 'experimentDataRequested',
  EXPERIMENT_DESIGN_EXPORTED = 'experimentDesignExported',
}

export enum EXPERIMENT_SEARCH_KEY {
  ALL = 'all',
  NAME = 'name',
  STATUS = 'status',
  TAG = 'tag',
  CONTEXT = 'context',
}

export enum EXPERIMENT_SORT_KEY {
  NAME = 'name',
  STATUS = 'state',
  CREATED_AT = 'createdAt',
  POST_EXPERIMENT_RULE = 'postExperimentRule',
}

export enum EXPERIMENT_SORT_AS {
  ASCENDING = 'ASC',
  DESCENDING = 'DESC',
}

export enum UserRole {
  ADMIN = 'admin',
  CREATOR = 'creator',
  USER_MANAGER = 'user manager',
  READER = 'reader',
}

export enum OPERATION_TYPES {
  SUM = 'sum',
  COUNT = 'count',
  MIN = 'min',
  MAX = 'max',
  AVERAGE = 'avg',
  MODE = 'mode',
  MEDIAN = 'median',
  STDEV = 'stddev',
  PERCENTAGE = 'percentage',
}

export enum IMetricMetaData {
  CONTINUOUS = 'continuous',
  CATEGORICAL = 'categorical',
}

export enum DATE_RANGE {
  LAST_SEVEN_DAYS = 'last_seven_days',
  LAST_THREE_MONTHS = 'last_three_months',
  LAST_SIX_MONTHS = 'last_six_months',
  LAST_TWELVE_MONTHS = 'last_twelve_months',
}

export enum REPEATED_MEASURE {
  mean = 'MEAN',
  earliest = 'EARLIEST',
  mostRecent = 'MOST RECENT',
  count = 'COUNT',
  percentage = 'PERCENTAGE',
}

export enum FILTER_MODE {
  INCLUDE_ALL = 'includeAll',
  EXCLUDE_ALL = 'excludeAll',
}

export enum SEGMENT_TYPE {
  PUBLIC = 'public',
  PRIVATE = 'private',
  GLOBAL_EXCLUDE = 'global_exclude',
}

export enum SEGMENT_STATUS {
  USED = 'Used',
  UNUSED = 'Unused',
  GLOBAL = 'Global',
  LOCKED = 'Locked',
  UNLOCKED = 'Unlocked',
}

export enum INCLUSION_CRITERIA {
  INCLUDE_SPECIFIC = 'Include Specific',
  EXCEPT = 'Include All Except...',
}

export enum EXPORT_METHOD {
  DESIGN = 'Download Experiment Design (JSON)',
  DATA = 'Email Experiment Data (CSV)',
}

export enum EXPERIMENT_TYPE {
  SIMPLE = 'Simple',
  FACTORIAL = 'Factorial',
}

export enum PAYLOAD_TYPE {
  STRING = 'string',
  JSON = 'json',
  CSV = 'csv',
}

export enum SUPPORTED_CALIPER_PROFILES {
  GRADING = 'GradingProfile',
}

export enum SUPPORTED_CALIPER_EVENTS {
  GRADE = 'GradeEvent',
}
