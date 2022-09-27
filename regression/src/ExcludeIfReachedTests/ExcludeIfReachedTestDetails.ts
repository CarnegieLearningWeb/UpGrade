import {
  ConditionAssertion,
  AssignmentUnit,
  ConditionCode,
  DecisionPointSite,
  ConsistencyRule,
} from "../constants";
import { SpecDetails } from "../mocks/SpecsDetails";

export const ExcludeIfReachedTestNames = {
  SINGLE_IND_IND_TRUE: "SINGLE_IND_IND_TRUE",
  SINGLE_IND_IND_FALSE: "SINGLE_IND_IND_FALSE",
  SINGLE_GRP_IND_TRUE: "SINGLE_GRP_IND_TRUE",
  SINGLE_GRP_IND_FALSE: "SINGLE_GRP_IND_FALSE",
  SINGLE_GRP_GRP_TRUE: "SINGLE_GRP_GRP_TRUE",
  SINGLE_GRP_GRP_FALSE: "SINGLE_GRP_GRP_FALSE",
  SINGLE_IND_EXP_TRUE: "SINGLE_IND_EXP_TRUE",
  SINGLE_IND_EXP_FALSE: "SINGLE_IND_EXP_FALSE",
  SINGLE_GRP_EXP_TRUE: "SINGLE_GRP_EXP_TRUE",
  SINGLE_GRP_EXP_FALSE: "SINGLE_GRP_EXP_FALSE",
};

export const ExcludeIfReachedSpecDetails: SpecDetails[] = [
  /*******************************************************************************************************************************
   * SINGLE_IND_IND_TRUE
   */
  {
    id: ExcludeIfReachedTestNames.SINGLE_IND_IND_TRUE,
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
        conditionShouldMatchUser: null,
      },
    },
    experiment: {
      id: ExcludeIfReachedTestNames.SINGLE_IND_IND_TRUE,
      assignmentUnit: AssignmentUnit.INDIVIDUAL,
      consistencyRule: ConsistencyRule.INDIVIDUAL,
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
          target: ExcludeIfReachedTestNames.SINGLE_IND_IND_TRUE + "_A",
          excludeIfReached: true,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * SINGLE_IND_IND_FALSE
   */
  {
    id: ExcludeIfReachedTestNames.SINGLE_IND_IND_FALSE,
    description:
      "Individual Assignment, Individual Consistency, Single Decision Point Experiment (One DP, exclude_if_reached is true)",
    assertions: {
      ABE: {
        conditionShouldBe: ConditionAssertion.CONTROL_OR_VARIANT,
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
        conditionShouldMatchUser: null,
      },
    },
    experiment: {
      id: ExcludeIfReachedTestNames.SINGLE_IND_IND_FALSE,
      assignmentUnit: AssignmentUnit.INDIVIDUAL,
      consistencyRule: ConsistencyRule.INDIVIDUAL,
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
          target: ExcludeIfReachedTestNames.SINGLE_IND_IND_FALSE + "_A",
          excludeIfReached: false,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * SINGLE_GRP_IND_TRUE
   */
  {
    id: ExcludeIfReachedTestNames.SINGLE_GRP_IND_TRUE,
    description:
      "Group Assignment, Individual Consistency, Single Decision Point Experiment (One DP, exclude_if_reached is true)",
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
        conditionShouldMatchUser: "CHAZ",
      },
    },
    experiment: {
      id: ExcludeIfReachedTestNames.SINGLE_GRP_IND_TRUE,
      assignmentUnit: AssignmentUnit.GROUP,
      consistencyRule: ConsistencyRule.INDIVIDUAL,
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
          target: ExcludeIfReachedTestNames.SINGLE_GRP_IND_TRUE + "_A",
          excludeIfReached: true,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * SINGLE_GRP_IND_FALSE
   */
  {
    id: ExcludeIfReachedTestNames.SINGLE_GRP_IND_FALSE,
    description:
      "Group Assignment, Individual Consistency, Single Decision Point Experiment (One DP, exclude_if_reached is false)",
    assertions: {
      ABE: {
        conditionShouldBe: ConditionAssertion.CONTROL_OR_VARIANT,
        conditionShouldMatchUser: null,
      },
      BORT: {
        conditionShouldBe: ConditionAssertion.CONTROL_OR_VARIANT,
        conditionShouldMatchUser: "ABE",
      },
      CHAZ: {
        conditionShouldBe: ConditionAssertion.CONTROL_OR_VARIANT,
        conditionShouldMatchUser: null,
      },
      DALE: {
        conditionShouldBe: ConditionAssertion.CONTROL_OR_VARIANT,
        conditionShouldMatchUser: "CHAZ",
      },
    },
    experiment: {
      id: ExcludeIfReachedTestNames.SINGLE_GRP_IND_FALSE,
      assignmentUnit: AssignmentUnit.GROUP,
      consistencyRule: ConsistencyRule.INDIVIDUAL,
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
          target: ExcludeIfReachedTestNames.SINGLE_GRP_IND_FALSE + "_A",
          excludeIfReached: false,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * SINGLE_GRP_GRP_TRUE
   */
  {
    id: ExcludeIfReachedTestNames.SINGLE_GRP_GRP_TRUE,
    description:
      "Group Assignment, Group Consistency, Single Decision Point Experiment (One DP, exclude_if_reached is true)",
    assertions: {
      ABE: {
        conditionShouldBe: ConditionAssertion.DEFAULT,
        conditionShouldMatchUser: null,
      },
      BORT: {
        conditionShouldBe: ConditionAssertion.DEFAULT,
        conditionShouldMatchUser: "ABE",
      },
      CHAZ: {
        conditionShouldBe: ConditionAssertion.CONTROL_OR_VARIANT,
        conditionShouldMatchUser: null,
      },
      DALE: {
        conditionShouldBe: ConditionAssertion.CONTROL_OR_VARIANT,
        conditionShouldMatchUser: "CHAZ",
      },
    },
    experiment: {
      id: ExcludeIfReachedTestNames.SINGLE_GRP_GRP_TRUE,
      assignmentUnit: AssignmentUnit.GROUP,
      consistencyRule: ConsistencyRule.GROUP,
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
          target: ExcludeIfReachedTestNames.SINGLE_GRP_GRP_TRUE + "_A",
          excludeIfReached: true,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * SINGLE_GRP_GRP_FALSE
   */
  {
    id: ExcludeIfReachedTestNames.SINGLE_GRP_GRP_FALSE,
    description:
      "Group Assignment, Group Consistency, Single Decision Point Experiment (One DP, exclude_if_reached is false)",
    assertions: {
      ABE: {
        conditionShouldBe: ConditionAssertion.CONTROL_OR_VARIANT,
        conditionShouldMatchUser: null,
      },
      BORT: {
        conditionShouldBe: ConditionAssertion.CONTROL_OR_VARIANT,
        conditionShouldMatchUser: "ABE",
      },
      CHAZ: {
        conditionShouldBe: ConditionAssertion.CONTROL_OR_VARIANT,
        conditionShouldMatchUser: null,
      },
      DALE: {
        conditionShouldBe: ConditionAssertion.CONTROL_OR_VARIANT,
        conditionShouldMatchUser: "CHAZ",
      },
    },
    experiment: {
      id: ExcludeIfReachedTestNames.SINGLE_GRP_GRP_FALSE,
      assignmentUnit: AssignmentUnit.GROUP,
      consistencyRule: ConsistencyRule.GROUP,
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
          target: ExcludeIfReachedTestNames.SINGLE_GRP_GRP_FALSE + "_A",
          excludeIfReached: false,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * SINGLE_IND_EXP_TRUE
   */
  {
    id: ExcludeIfReachedTestNames.SINGLE_IND_EXP_TRUE,
    description:
      "Individual Assignment, Experiment Consistency, Single Decision Point Experiment (One DP, exclude_if_reached is false)",
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
        conditionShouldMatchUser: null,
      },
    },
    experiment: {
      id: ExcludeIfReachedTestNames.SINGLE_IND_EXP_TRUE,
      assignmentUnit: AssignmentUnit.INDIVIDUAL,
      consistencyRule: ConsistencyRule.EXPERIMENT,
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
          target: ExcludeIfReachedTestNames.SINGLE_IND_EXP_TRUE + "_A",
          excludeIfReached: true,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * SINGLE_IND_EXP_FALSE
   */
  {
    id: ExcludeIfReachedTestNames.SINGLE_IND_EXP_FALSE,
    description:
      "Individual Assignment, Experiment Consistency, Single Decision Point Experiment (One DP, exclude_if_reached is false)",
    assertions: {
      ABE: {
        conditionShouldBe: ConditionAssertion.CONTROL_OR_VARIANT,
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
        conditionShouldMatchUser: null,
      },
    },
    experiment: {
      id: ExcludeIfReachedTestNames.SINGLE_IND_EXP_FALSE,
      assignmentUnit: AssignmentUnit.INDIVIDUAL,
      consistencyRule: ConsistencyRule.EXPERIMENT,
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
          target: ExcludeIfReachedTestNames.SINGLE_IND_EXP_FALSE + "_A",
          excludeIfReached: false,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * SINGLE_GRP_EXP_TRUE
   */
  {
    id: ExcludeIfReachedTestNames.SINGLE_GRP_EXP_TRUE,
    description:
      "Group Assignment, Experiment Consistency, Single Decision Point Experiment (One DP, exclude_if_reached is true)",
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
        conditionShouldMatchUser: "CHAZ",
      },
    },
    experiment: {
      id: ExcludeIfReachedTestNames.SINGLE_GRP_EXP_TRUE,
      assignmentUnit: AssignmentUnit.GROUP,
      consistencyRule: ConsistencyRule.EXPERIMENT,
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
          target: ExcludeIfReachedTestNames.SINGLE_GRP_EXP_TRUE + "_A",
          excludeIfReached: true,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * SINGLE_GRP_EXP_FALSE
   */
  {
    id: ExcludeIfReachedTestNames.SINGLE_GRP_EXP_FALSE,
    description:
      "Group Assignment, Experiment Consistency, Single Decision Point Experiment (One DP, exclude_if_reached is false)",
    assertions: {
      ABE: {
        conditionShouldBe: ConditionAssertion.CONTROL_OR_VARIANT,
        conditionShouldMatchUser: null,
      },
      BORT: {
        conditionShouldBe: ConditionAssertion.CONTROL_OR_VARIANT,
        conditionShouldMatchUser: "ABE",
      },
      CHAZ: {
        conditionShouldBe: ConditionAssertion.CONTROL_OR_VARIANT,
        conditionShouldMatchUser: null,
      },
      DALE: {
        conditionShouldBe: ConditionAssertion.CONTROL_OR_VARIANT,
        conditionShouldMatchUser: "CHAZ",
      },
    },
    experiment: {
      id: ExcludeIfReachedTestNames.SINGLE_GRP_EXP_FALSE,
      assignmentUnit: AssignmentUnit.GROUP,
      consistencyRule: ConsistencyRule.EXPERIMENT,
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
          target: ExcludeIfReachedTestNames.SINGLE_GRP_EXP_FALSE + "_A",
          excludeIfReached: false,
        },
      ],
    },
  },
];
