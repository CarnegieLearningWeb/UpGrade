export type InitUserRequestBody = {
  id: string;
  group: {
    schoolId: string[];
  };
  workingGroup: {
    schoolId: string;
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
  context: "test";
};

export type ExperimentRequestBody = {
  id?: string;
  name: string;
  description: string;
  consistencyRule: "group" | "individual" | "experiment";
  assignmentUnit: "group" | "individual";
  context: ["test"];
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
  conditionAliases: [];
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
  filterMode: "includeAll" | "excludeAll";
  queries: string[];
  endOn: null;
  enrollmentCompleteCondition: null;
  startOn: null;
  state: "inactive";
  postExperimentRule: "continue";
  revertTo: null;
};
