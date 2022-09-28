export type ExcludeIfReachedSuiteOptions = {
  writeSimpleSummaryToFile: boolean;
  writeDetailedSummaryToFile: boolean;
  writePath: string;
};

export type SpecDetails = {
  id: string;
  description: string;
  experiment: MockExperimentDetails;
  assertions: SpecAssertionList;
};

export type MockExperimentDetails = {
  assignmentUnit: string;
  consistencyRule: string;
  conditions: MockExperimentCondition[];
  decisionPoints: MockDecisionPoint[];
};

export type MockExperimentCondition = {
  conditionCode: string;
};

export type MockDecisionPoint = {
  targetSuffix: string;
  excludeIfReached: boolean;
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
  assignedCondition: string;
  expected: SpecAssertion;
  result?: SpecResult;
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
