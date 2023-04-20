export type InitUserRequestBody = {
  id: string;
  group: {
    [key: string]: string[];
  };
  workingGroup: {
    [key: string]: string;
  };
};

export type MarkRequestBody = {
  userId: string;
  experimentPoint: string;
  partitionId: string;
  condition: string;
};

export type StatusRequestBody = {
  experimentId: string;
  state: "enrolling" | "inactive";
};

export type AssignRequestBody = {
  userId: string;
  context: string;
};

export type AssignResponse = {
  expPoint: string;
  expId: string;
  twoCharacterId: string;
  assignedCondition: {
    createdAt: string;
    updatedAt: string;
    versionNumber: number;
    id: string;
    twoCharacterId: string;
    name: string;
    description: string;
    conditionCode: string;
    assignmentWeight: number;
    order: number;
  };
};

export type ExperimentRequestResponseBody = {
  id?: string;
  name: string;
  description: string;
  consistencyRule: string;
  assignmentUnit: string;
  context: string[];
  group?: string;
  tags: string[];
  logging: boolean;
  conditions: {
    id: string;
    conditionCode: string;
    assignmentWeight: string;
    description: string;
    order: number;
    name: string;
  }[];
  partitions: {
    site: string;
    target: string;
    description: string;
    order: number;
    excludeIfReached: boolean;
  }[];
  conditionPayloads: [];
  experimentSegmentInclusion: {
    userIds: string[];
    groups: string[];
    subSegmentIds: string[];
    type: string;
  };
  experimentSegmentExclusion: {
    userIds: string[];
    groups: string[];
    subSegmentIds: string[];
    type: string;
  };
  filterMode: 'includeAll' | 'excludeAll';
  queries: string[];
  endOn: null;
  enrollmentCompleteCondition: null;
  startOn: null;
  state: 'inactive';
  postExperimentRule: 'continue';
  revertTo: null;
};
