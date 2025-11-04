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

export enum ASSIGNMENT_ALGORITHM {
  RANDOM = 'random',
  STRATIFIED_RANDOM_SAMPLING = 'stratified random sampling',
  MOOCLET_TS_CONFIGURABLE = 'ts_configurable',
}

export const ASSIGNMENT_ALGORITHM_DISPLAY_MAP = {
  [ASSIGNMENT_ALGORITHM.RANDOM]: 'Random',
  [ASSIGNMENT_ALGORITHM.STRATIFIED_RANDOM_SAMPLING]: 'Stratified Random Sampling',
  [ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE]: 'TS Configurable',
};

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
  ARCHIVED = 'archived',
  DRAFT = 'draft',
}

export enum FEATURE_FLAG_STATUS {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  ARCHIVED = 'archived',
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
  TOKEN_VALIDATION_FAILED = 'JWT Token validation failed',
  MIGRATION_ERROR = 'Error in migration',
  EMAIL_SEND_ERROR = 'Email send error',
  CONDITION_NOT_FOUND = 'Condition not found',
  EXPERIMENT_ID_MISSING_FOR_SHARED_DECISIONPOINT = 'Experiment ID not provided for shared Decision Point',
  INVALID_EXPERIMENT_ID_FOR_SHARED_DECISIONPOINT = 'Experiment ID provided is invalid for shared Decision Point',
  UNSUPPORTED_CALIPER = 'Caliper profile or event not supported',
  DUPLICATE_KEY = 'Feature Flag with same key already exists for this app-context',
  MISSING_HEADER_USER_ID = 'Missing `User-Id` header',
  SEGMENT_DUPLICATE_NAME = 'Segment with same name already exists for this app-context.',
  INVALID_APP_CONTEXT = 'Invalid app context',
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
  // individual level:
  REACHED_PRIOR = 'participant reached experiment prior to experiment enrolling',
  REACHED_AFTER = 'participant reached experiment during enrollment complete',
  // experiment level:
  PARTICIPANT_ON_EXCLUSION_LIST = 'participant was on the exclusion list',
  GROUP_ON_EXCLUSION_LIST = 'participant’s group was on the exclusion list',
  // group level:
  EXCLUDED_DUE_TO_GROUP_LOGIC = 'participant excluded due to group assignment logic',
  NO_GROUP_SPECIFIED = 'participant excluded due to incomplete group information',
  INVALID_GROUP_OR_WORKING_GROUP = "participant's group or working group is incorrect",
  // triggered by client SDK:
  EXCLUDED_BY_CLIENT = 'participant is excluded by client',
  // generic error (for future use):
  ERROR = 'participant excluded due to unspecified error',
}

export enum LOG_TYPE {
  EXPERIMENT_CREATED = 'experimentCreated',
  EXPERIMENT_UPDATED = 'experimentUpdated',
  EXPERIMENT_STATE_CHANGED = 'experimentStateChanged',
  EXPERIMENT_DELETED = 'experimentDeleted',
  EXPERIMENT_DATA_EXPORTED = 'experimentDataExported',
  EXPERIMENT_DESIGN_EXPORTED = 'experimentDesignExported',
  FEATURE_FLAG_CREATED = 'featureFlagCreated',
  FEATURE_FLAG_UPDATED = 'featureFlagUpdated',
  FEATURE_FLAG_STATUS_CHANGED = 'featureFlagStatusChanged',
  FEATURE_FLAG_DELETED = 'featureFlagDeleted',
  FEATURE_FLAG_DATA_EXPORTED = 'featureFlagDataExported',
  FEATURE_FLAG_DESIGN_EXPORTED = 'featureFlagDesignExported',
}

export enum FEATURE_FLAG_LIST_OPERATION {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  STATUS_CHANGED = 'statusChanged',
}

export enum FEATURE_FLAG_LIST_FILTER_MODE {
  INCLUSION = 'inclusion',
  EXCLUSION = 'exclusion',
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
  UPDATED_AT = 'updatedAt',
  POST_EXPERIMENT_RULE = 'postExperimentRule',
}

export enum SORT_AS_DIRECTION {
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
  EXCLUDED = 'Excluded',
  LOCKED = 'Locked',
  UNLOCKED = 'Unlocked',
}

export enum SEGMENT_SEARCH_KEY {
  ALL = 'all',
  NAME = 'name',
  TAG = 'tag',
  STATUS = 'status',
  CONTEXT = 'context',
}

export enum SEGMENT_SORT_KEY {
  NAME = 'name',
  UPDATED_AT = 'updatedAt',
}

export enum FLAG_SEARCH_KEY {
  ALL = 'all',
  NAME = 'name',
  KEY = 'key',
  STATUS = 'status',
  TAG = 'tag',
  CONTEXT = 'context',
}

export enum METRIC_SEARCH_KEY {
  ALL = 'all',
  NAME = 'name',
  CONTEXT = 'context',
}

export enum FLAG_SORT_KEY {
  NAME = 'name',
  STATUS = 'status',
  UPDATED_AT = 'updatedAt',
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

export enum CACHE_PREFIX {
  EXPERIMENT_KEY_PREFIX = 'validExperiments-',
  SEGMENT_KEY_PREFIX = 'segments-',
  MARK_KEY_PREFIX = 'markExperiments-',
  FEATURE_FLAG_KEY_PREFIX = 'featureFlags-',
}

export enum STATUS_INDICATOR_CHIP_TYPE {
  EXCLUDED = 'excluded',
  USED = 'used',
  UNUSED = 'unused',
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  DRAFT = 'draft',
  ARCHIVED = 'archived',
  INACTIVE = 'inactive',
  ENROLLING = 'enrolling',
  ENROLLMENT_COMPLETE = 'enrollment-complete',
  CANCELLED = 'cancelled',
  SCHEDULED = 'scheduled',
  COMPATIBLE = 'compatible',
  INCOMPATIBLE = 'incompatible',
  WARNING = 'warning',
}

export enum FEATURE_FLAG_PARTICIPANT_LIST_KEY {
  INCLUDE = 'featureFlagSegmentInclusion',
  EXCLUDE = 'featureFlagSegmentExclusion',
}

export enum FILE_TYPE {
  JSON = '.json',
  CSV = '.csv',
}

export enum IMPORT_COMPATIBILITY_TYPE {
  COMPATIBLE = 'compatible',
  WARNING = 'warning',
  INCOMPATIBLE = 'incompatible',
}
