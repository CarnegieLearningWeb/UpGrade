export type ExcludeIfReachedSuiteOptions = {
  writeSimpleSummaryToFile: boolean;
  writeDetailedSummaryToFile: boolean;
  writePath: string;
  runThisManyTimes?: number;
};

export type SpecDetails = {
  id: string;
  description: string;
  experiment: MockExperimentDetails;
  assertions: SpecAssertionList;
  options?: SpecOptions;
};

export type SpecOptions = {
  useParentConditionAliasMap?: null | ParentConditionAliasMap;
  useCustomAssertion?: null | string;
};

export type ParentConditionAliasMap = { [key: string]: string };

export type MockConditionAlias = {
  aliasName: string;
  decisionPointTargetSuffix: string;
  conditionCode: string;
};

export type MockExperimentDetails = {
  assignmentUnit: string;
  consistencyRule: string;
  conditions: MockExperimentCondition[];
  decisionPoints: MockDecisionPoint[];
  conditionAliases?: MockConditionAlias[];
};

export type MockExperimentCondition = {
  conditionCode: string;
};

export type MockDecisionPoint = {
  targetSuffix: string;
  excludeIfReached: boolean;
};

export type SpectSummaryMetadata = {
  date: string;
  environment: string;
  context: string;
  appVersion: string;
};

export type SpecResultsSummary = {
  id: string;
  description: string;
  assignResponseSummary: AssignmentResponseSummary[];
};

export type SimpleSummary = {
  testName: string;
  description: string;
  result: string;
};

export type AssignmentResponseSummary = {
  userId: string;
  actualAssignedConditions: ActualAssignedCondition[];
  assignedConditionForAll: string | null;
  expected: SpecAssertion;
  result?: SpecResult;
};

export type ActualAssignedCondition = {
  decisionPointTarget: string;
  condition: string;
};

export type SpecResult = {
  conditionPasses: boolean;
  userMatchPasses: boolean;
  overall: string;
};

export type SpecAssertion = {
  conditionShouldBe: string;
  conditionShouldMatchUser: string | null;
};

export type SpecAssertionList = {
  ABE: SpecAssertion;
  BORT: SpecAssertion;
  CHAZ: SpecAssertion;
  DALE: SpecAssertion;
};
