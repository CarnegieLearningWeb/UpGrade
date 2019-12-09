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
  REVERT_TO_DEFAULT = 'revertToDefault',
}

export enum EXPERIMENT_STATE {
  INACTIVE = 'inactive',
  DEMO = 'demo',
  SCHEDULED = 'scheduled',
  ENROLLING = 'enrolling',
  ENROLLMENT_COMPLETE = 'enrollmentComplete',
  CANCELLED = 'cancelled',
}
