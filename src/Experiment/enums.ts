export enum CONSISTENCY_RULE {
  INDIVIDUAL = 'individual',
  EXPERIMENT = 'experiment',
  GROUP = 'group',
}

export enum ASSIGNMENT_UNIT {
  INDIVIDUAL = 'individual',
  GROUP = 'group',
}

export enum POST_EXPERIMENT_RULE {
  CONTINUE = 'continue',
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
}

export enum ENROLLMENT_CODE {
  INCLUDED = 'Student included in experiment',
  PRIOR_EXPERIMENT_ENROLLING = 'Student reached experiment point prior to experiment enrolling',
  STUDENT_EXCLUDED = 'Student was on exclusion list',
  GROUP_EXCLUDED = 'GROUP was on exclusion list',
}

export enum EXPERIMENT_LOG_TYPE {
  EXPERIMENT_CREATED = 'experimentCreated',
  EXPERIMENT_UPDATED = 'experimentUpdated',
  EXPERIMENT_STATE_CHANGED = 'experimentStateChanged',
  EXPERIMENT_DELETED = 'experimentDeleted',
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
  mostRecent = 'MOST_RECENT',
}
