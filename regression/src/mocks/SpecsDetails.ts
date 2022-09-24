import {
  ConditionAssertion,
  AssignmentUnit,
  ConditionCode,
  DecisionPointSite,
} from "../constants";
import { UserName, UserNameType } from "./Users";

export type SpecDetails = {
  id: string;
  description: string;
  experiment: MockExperimentDetails;
  assertions: SpecAssertionList;
};

export type MockExperimentDetails = {
  id: string;
  assignmentUnit: string;
  consistencyRule: string;
  conditions: MockExperimentCondition[];
  decisionPoints: MockDecisionPoint[];
};

export type MockExperimentCondition = {
  conditionCode: string;
};

export type MockDecisionPoint = {
  site: string;
  target: string;
  excludeIfReached: boolean;
};

export type SpecResultsSummary = {
  id: string;
  description: string;
  assignResponseSummary: AssignmentResponseSummary[];
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
  conditionShouldMatchUser: UserNameType | null;
};

export type SpecAssertionList = {
  ABE: SpecAssertion;
  BORT: SpecAssertion;
  CHAZ: SpecAssertion;
  DALE: SpecAssertion;
};

export const ExcludeIfReachedSpecDetails: SpecDetails[] = [
  {
    id: "SINGLE_IND_IND",
    description:
      "Individual Assignment, Individual Consistency, Single Decision Point Experiment (One DP, exclude_if_reached is true)",
    assertions: {
      ABE: {
        conditionShouldBe: ConditionAssertion.DEFAULT,
        conditionShouldMatchUser: null,
      },
      BORT: {
        conditionShouldBe: ConditionAssertion.CONTROL_OR_VARIANT,
        conditionShouldMatchUser: null,
      },
      CHAZ: {
        conditionShouldBe: ConditionAssertion.CONTROL_OR_VARIANT,
        conditionShouldMatchUser: null,
      },
      DALE: {
        conditionShouldBe: ConditionAssertion.CONTROL_OR_VARIANT,
        conditionShouldMatchUser: "ABE",
      },
    },
    experiment: {
      id: "SINGLE_IND_IND",
      assignmentUnit: AssignmentUnit.INDIVIDUAL,
      consistencyRule: AssignmentUnit.INDIVIDUAL,
      conditions: [
        {
          conditionCode: ConditionCode.CONTROL,
        },
        {
          conditionCode: ConditionCode.VARIANT,
        },
      ],
      decisionPoints: [
        {
          site: DecisionPointSite.SELECT_SECTION,
          target: "SINGLE_IND_IND_A",
          excludeIfReached: true,
        },
      ],
    },
  },
];
