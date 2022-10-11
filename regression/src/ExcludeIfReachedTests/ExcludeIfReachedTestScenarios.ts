import {
  ConditionAssertion,
  AssignmentUnit,
  ConditionCode,
  ConsistencyRule,
} from "../constants";
import { SpecDetails } from "../mocks/SpecsDetails";
import { ExcludeIfReachedAssertionProfiles as AssertionProfile } from "./ExcludeIfReachedExclusionProfiles";

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
  IND_IND_TWO_DP_BOTH_TRUE: "IND_IND_TWO_DP_BOTH_TRUE",
  IND_IND_TWO_DP_BOTH_FALSE: "IND_IND_TWO_DP_BOTH_FALSE",
  IND_IND_TWO_DP_TARGETA_TRUE: "IND_IND_TWO_DP_TARGETA_TRUE",
  IND_IND_TWO_DP_TARGETB_TRUE: "IND_IND_TWO_DP_TARGETB_TRUE",
  GRP_IND_TWO_DP_BOTH_TRUE: "GRP_IND_TWO_DP_BOTH_TRUE",
  GRP_IND_TWO_DP_BOTH_FALSE: "GRP_IND_TWO_DP_BOTH_FALSE",
  GRP_IND_TWO_DP_TARGETA_TRUE: "GRP_IND_TWO_DP_TARGETA_TRUE",
  GRP_IND_TWO_DP_TARGETB_TRUE: "GRP_IND_TWO_DP_TARGETB_TRUE",
  GRP_GRP_TWO_DP_BOTH_TRUE: "GRP_GRP_TWO_DP_BOTH_TRUE",
  GRP_GRP_TWO_DP_BOTH_FALSE: "GRP_GRP_TWO_DP_BOTH_FALSE",
  GRP_GRP_TWO_DP_TARGETA_TRUE: "GRP_GRP_TWO_DP_TARGETA_TRUE",
  GRP_GRP_TWO_DP_TARGETB_TRUE: "GRP_GRP_TWO_DP_TARGETB_TRUE",
  GRP_EXP_TWO_DP_BOTH_TRUE: "GRP_EXP_TWO_DP_BOTH_TRUE",
  GRP_EXP_TWO_DP_BOTH_FALSE: "GRP_EXP_TWO_DP_BOTH_FALSE",
  GRP_EXP_TWO_DP_TARGETA_TRUE: "GRP_EXP_TWO_DP_TARGETA_TRUE",
  GRP_EXP_TWO_DP_TARGETB_TRUE: "GRP_EXP_TWO_DP_TARGETB_TRUE",
  IND_EXP_TWO_DP_BOTH_TRUE: "IND_EXP_TWO_DP_BOTH_TRUE",
  IND_EXP_TWO_DP_BOTH_FALSE: "IND_EXP_TWO_DP_BOTH_FALSE",
  IND_EXP_TWO_DP_TARGETA_TRUE: "IND_EXP_TWO_DP_TARGETA_TRUE",
  IND_EXP_TWO_DP_TARGETB_TRUE: "IND_EXP_TWO_DP_TARGETB_TRUE",
};

export const ExcludeIfReachedSpecDetails: SpecDetails[] = [
  /*******************************************************************************************************************************
   * SINGLE_IND_IND_TRUE
   */
  {
    id: ExcludeIfReachedTestNames.SINGLE_IND_IND_TRUE,
    description:
      "Individual Assignment, Individual Consistency, Single Decision Point Experiment (One DP, exclude_if_reached is true)",
    assertions: AssertionProfile.ABE_EXCLUDED_OTHERS_GET_INDEPENDENT_CONDITION,
    experiment: {
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
          targetSuffix: "_A",
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
      "Individual Assignment, Individual Consistency, Single Decision Point Experiment (One DP, exclude_if_reached is false)",
    assertions: AssertionProfile.NO_EXCLUSIONS_ALL_GET_INDEPENDENT_CONDITION,
    experiment: {
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
          targetSuffix: "_A",
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
    assertions: AssertionProfile.ABE_EXCLUDED_OTHERS_GET_INDEPENDENT_CONDITION,
    experiment: {
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
          targetSuffix: "_A",
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
    assertions:
      AssertionProfile.NO_EXCLUSIONS_ABE_AND_BORT_CONDITTIONS_MATCH_CHAZ_AND_DALE_CONDITIONS_MATCH,
    experiment: {
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
          targetSuffix: "_A",
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
    assertions:
      AssertionProfile.ABE_AND_BORT_EXCLUDED_CHAZ_AND_DALE_MATCH_CONDITIONS,
    experiment: {
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
          targetSuffix: "_A",
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
    assertions:
      AssertionProfile.NO_EXCLUSIONS_ABE_AND_BORT_CONDITTIONS_MATCH_CHAZ_AND_DALE_CONDITIONS_MATCH,
    experiment: {
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
          targetSuffix: "_A",
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
      "Individual Assignment, Experiment Consistency, Single Decision Point Experiment (One DP, exclude_if_reached is true)",
    assertions: AssertionProfile.NO_EXCLUSIONS_ALL_GET_INDEPENDENT_CONDITION,
    experiment: {
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
          targetSuffix: "_A",
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
    assertions: AssertionProfile.NO_EXCLUSIONS_ALL_GET_INDEPENDENT_CONDITION,
    experiment: {
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
          targetSuffix: "_A",
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
    assertions:
      AssertionProfile.NO_EXCLUSIONS_ABE_AND_BORT_CONDITTIONS_MATCH_CHAZ_AND_DALE_CONDITIONS_MATCH,
    experiment: {
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
          targetSuffix: "_A",
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
    assertions:
      AssertionProfile.NO_EXCLUSIONS_ABE_AND_BORT_CONDITTIONS_MATCH_CHAZ_AND_DALE_CONDITIONS_MATCH,
    experiment: {
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
          targetSuffix: "_A",
          excludeIfReached: false,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * IND_IND_TWO_DP_BOTH_TRUE
   */
  {
    id: ExcludeIfReachedTestNames.IND_IND_TWO_DP_BOTH_TRUE,
    description:
      "Individual Assignment, Individual Consistency, Two Decision Point Experiment (exclude_if_reached is true for both)",
    assertions: AssertionProfile.ABE_EXCLUDED_OTHERS_GET_INDEPENDENT_CONDITION,
    experiment: {
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
          targetSuffix: "_A",
          excludeIfReached: true,
        },
        {
          targetSuffix: "_B",
          excludeIfReached: true,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * IND_IND_TWO_DP_BOTH_FALSE
   */
  {
    id: ExcludeIfReachedTestNames.IND_IND_TWO_DP_BOTH_FALSE,
    description:
      "Individual Assignment, Individual Consistency, Two Decision Point Experiment (exclude_if_reached is false for both)",
    assertions: AssertionProfile.NO_EXCLUSIONS_ALL_GET_INDEPENDENT_CONDITION,
    experiment: {
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
          targetSuffix: "_A",
          excludeIfReached: false,
        },
        {
          targetSuffix: "_B",
          excludeIfReached: false,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * IND_IND_TWO_DP_TARGETA_TRUE
   */
  {
    id: ExcludeIfReachedTestNames.IND_IND_TWO_DP_TARGETA_TRUE,
    description:
      "Individual Assignment, Individual Consistency, Two Decision Point Experiment (exclude_if_reached is true for target A)",
    assertions: AssertionProfile.ABE_EXCLUDED_OTHERS_GET_INDEPENDENT_CONDITION,
    experiment: {
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
          targetSuffix: "_A",
          excludeIfReached: true,
        },
        {
          targetSuffix: "_B",
          excludeIfReached: false,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * IND_IND_TWO_DP_TARGETB_TRUE
   */
  {
    id: ExcludeIfReachedTestNames.IND_IND_TWO_DP_TARGETB_TRUE,
    description:
      "Individual Assignment, Individual Consistency, Two Decision Point Experiment (exclude_if_reached is true for target B)",
    assertions: AssertionProfile.NO_EXCLUSIONS_ALL_GET_INDEPENDENT_CONDITION,
    experiment: {
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
          targetSuffix: "_A",
          excludeIfReached: false,
        },
        {
          targetSuffix: "_B",
          excludeIfReached: true,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * GRP_IND_TWO_DP_BOTH_TRUE
   */
  {
    id: ExcludeIfReachedTestNames.GRP_IND_TWO_DP_BOTH_TRUE,
    description:
      "Group Assignment, Individual Consistency, Two Decision Point Experiment (exclude_if_reached is true for both)",
    assertions:
      AssertionProfile.ABE_EXCLUDED_BORT_INDEPENDENT_CONDITION_CHAZ_AND_DALE_CONDITIONS_MATCH,
    experiment: {
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
          targetSuffix: "_A",
          excludeIfReached: true,
        },
        {
          targetSuffix: "_B",
          excludeIfReached: true,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * GRP_IND_TWO_DP_BOTH_FALSE
   */
  {
    id: ExcludeIfReachedTestNames.GRP_IND_TWO_DP_BOTH_FALSE,
    description:
      "Group Assignment, Individual Consistency, Two Decision Point Experiment (exclude_if_reached is false for both)",
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
        conditionShouldMatchUser: "CHAZ",
      },
    },
    experiment: {
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
          targetSuffix: "_A",
          excludeIfReached: false,
        },
        {
          targetSuffix: "_B",
          excludeIfReached: false,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * GRP_IND_TWO_DP_TARGETA_TRUE
   */
  {
    id: ExcludeIfReachedTestNames.GRP_IND_TWO_DP_TARGETA_TRUE,
    description:
      "Group Assignment, Individual Consistency, Two Decision Point Experiment (exclude_if_reached is true for target A)",
    assertions:
      AssertionProfile.ABE_EXCLUDED_BORT_INDEPENDENT_CONDITION_CHAZ_AND_DALE_CONDITIONS_MATCH,
    experiment: {
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
          targetSuffix: "_A",
          excludeIfReached: true,
        },
        {
          targetSuffix: "_B",
          excludeIfReached: false,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * GRP_IND_TWO_DP_TARGETB_TRUE
   */
  {
    id: ExcludeIfReachedTestNames.GRP_IND_TWO_DP_TARGETB_TRUE,
    description:
      "Group Assignment, Individual Consistency, Two Decision Point Experiment (exclude_if_reached is true for target B)",
    assertions:
      AssertionProfile.NO_EXCLUSIONS_ABE_AND_BORT_CONDITTIONS_MATCH_CHAZ_AND_DALE_CONDITIONS_MATCH,
    experiment: {
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
          targetSuffix: "_A",
          excludeIfReached: false,
        },
        {
          targetSuffix: "_B",
          excludeIfReached: true,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * GRP_GRP_TWO_DP_BOTH_TRUE
   */
  {
    id: ExcludeIfReachedTestNames.GRP_GRP_TWO_DP_BOTH_TRUE,
    description:
      "Group Assignment, Group Consistency, Two Decision Point Experiment (exclude_if_reached is true for both)",
    assertions:
      AssertionProfile.ABE_AND_BORT_EXCLUDED_CHAZ_AND_DALE_MATCH_CONDITIONS,
    experiment: {
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
          targetSuffix: "_A",
          excludeIfReached: true,
        },
        {
          targetSuffix: "_B",
          excludeIfReached: true,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * GRP_GRP_TWO_DP_BOTH_FALSE
   */
  {
    id: ExcludeIfReachedTestNames.GRP_GRP_TWO_DP_BOTH_FALSE,
    description:
      "Group Assignment, Group Consistency, Two Decision Point Experiment (exclude_if_reached is false for both)",
    assertions:
      AssertionProfile.NO_EXCLUSIONS_ABE_AND_BORT_CONDITTIONS_MATCH_CHAZ_AND_DALE_CONDITIONS_MATCH,
    experiment: {
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
          targetSuffix: "_A",
          excludeIfReached: false,
        },
        {
          targetSuffix: "_B",
          excludeIfReached: false,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * GRP_GRP_TWO_DP_TARGETA_TRUE
   */
  {
    id: ExcludeIfReachedTestNames.GRP_GRP_TWO_DP_TARGETA_TRUE,
    description:
      "Group Assignment, Group Consistency, Two Decision Point Experiment (exclude_if_reached is true for target A)",
    assertions:
      AssertionProfile.ABE_AND_BORT_EXCLUDED_CHAZ_AND_DALE_MATCH_CONDITIONS,
    experiment: {
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
          targetSuffix: "_A",
          excludeIfReached: true,
        },
        {
          targetSuffix: "_B",
          excludeIfReached: false,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * GRP_GRP_TWO_DP_TARGETB_TRUE
   */
  {
    id: ExcludeIfReachedTestNames.GRP_GRP_TWO_DP_TARGETB_TRUE,
    description:
      "Group Assignment, Group Consistency, Two Decision Point Experiment (exclude_if_reached is true for target B)",
    assertions:
      AssertionProfile.NO_EXCLUSIONS_ABE_AND_BORT_CONDITTIONS_MATCH_CHAZ_AND_DALE_CONDITIONS_MATCH,
    experiment: {
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
          targetSuffix: "_A",
          excludeIfReached: false,
        },
        {
          targetSuffix: "_B",
          excludeIfReached: true,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * GRP_IND_TWO_DP_TARGETB_TRUE
   */
  {
    id: ExcludeIfReachedTestNames.GRP_IND_TWO_DP_TARGETB_TRUE,
    description:
      "Group Assignment, GROUP Consistency, Two Decision Point Experiment (exclude_if_reached is true for target B)",
    assertions:
      AssertionProfile.NO_EXCLUSIONS_ABE_AND_BORT_CONDITTIONS_MATCH_CHAZ_AND_DALE_CONDITIONS_MATCH,
    experiment: {
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
          targetSuffix: "_A",
          excludeIfReached: false,
        },
        {
          targetSuffix: "_B",
          excludeIfReached: true,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * IND_EXP_TWO_DP_BOTH_TRUE
   */
  {
    id: ExcludeIfReachedTestNames.IND_EXP_TWO_DP_BOTH_TRUE,
    description:
      "Individual Assignment, Experiment Consistency, Two Decision Point Experiment (exclude_if_reached is true for both)",
    assertions: AssertionProfile.NO_EXCLUSIONS_ALL_GET_INDEPENDENT_CONDITION,
    experiment: {
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
          targetSuffix: "_A",
          excludeIfReached: true,
        },
        {
          targetSuffix: "_B",
          excludeIfReached: true,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * IND_EXP_TWO_DP_BOTH_FALSE
   */
  {
    id: ExcludeIfReachedTestNames.IND_EXP_TWO_DP_BOTH_FALSE,
    description:
      "Individual Assignment, Experiment Consistency, Two Decision Point Experiment (exclude_if_reached is false for both)",
    assertions: AssertionProfile.NO_EXCLUSIONS_ALL_GET_INDEPENDENT_CONDITION,
    experiment: {
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
          targetSuffix: "_A",
          excludeIfReached: false,
        },
        {
          targetSuffix: "_B",
          excludeIfReached: false,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * IND_EXP_TWO_DP_TARGETA_TRUE
   */
  {
    id: ExcludeIfReachedTestNames.IND_EXP_TWO_DP_TARGETA_TRUE,
    description:
      "Individual Assignment, Experiment Consistency, Two Decision Point Experiment (exclude_if_reached is true for target A)",
    assertions: AssertionProfile.NO_EXCLUSIONS_ALL_GET_INDEPENDENT_CONDITION,
    experiment: {
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
          targetSuffix: "_A",
          excludeIfReached: true,
        },
        {
          targetSuffix: "_B",
          excludeIfReached: false,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * IND_EXP_TWO_DP_TARGETB_TRUE
   */
  {
    id: ExcludeIfReachedTestNames.IND_EXP_TWO_DP_TARGETB_TRUE,
    description:
      "Individual Assignment, Experiment Consistency, Two Decision Point Experiment (exclude_if_reached is true for target B)",
    assertions: AssertionProfile.NO_EXCLUSIONS_ALL_GET_INDEPENDENT_CONDITION,
    experiment: {
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
          targetSuffix: "_A",
          excludeIfReached: false,
        },
        {
          targetSuffix: "_B",
          excludeIfReached: true,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * GRP_EXP_TWO_DP_BOTH_TRUE
   */
  {
    id: ExcludeIfReachedTestNames.GRP_EXP_TWO_DP_BOTH_TRUE,
    description:
      "Group Assignment, Experiment Consistency, Two Decision Point Experiment (exclude_if_reached is true for both)",
    assertions:
      AssertionProfile.NO_EXCLUSIONS_ABE_AND_BORT_CONDITTIONS_MATCH_CHAZ_AND_DALE_CONDITIONS_MATCH,
    experiment: {
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
          targetSuffix: "_A",
          excludeIfReached: true,
        },
        {
          targetSuffix: "_B",
          excludeIfReached: true,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * GRP_EXP_TWO_DP_BOTH_FALSE
   */
  {
    id: ExcludeIfReachedTestNames.GRP_EXP_TWO_DP_BOTH_FALSE,
    description:
      "Group Assignment, Experiment Consistency, Two Decision Point Experiment (exclude_if_reached is false for both)",
    assertions:
      AssertionProfile.NO_EXCLUSIONS_ABE_AND_BORT_CONDITTIONS_MATCH_CHAZ_AND_DALE_CONDITIONS_MATCH,
    experiment: {
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
          targetSuffix: "_A",
          excludeIfReached: false,
        },
        {
          targetSuffix: "_B",
          excludeIfReached: false,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * GRP_EXP_TWO_DP_TARGETA_TRUE
   */
  {
    id: ExcludeIfReachedTestNames.GRP_EXP_TWO_DP_TARGETA_TRUE,
    description:
      "Group Assignment, Experiment Consistency, Two Decision Point Experiment (exclude_if_reached is true for target A)",
    assertions:
      AssertionProfile.NO_EXCLUSIONS_ABE_AND_BORT_CONDITTIONS_MATCH_CHAZ_AND_DALE_CONDITIONS_MATCH,
    experiment: {
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
          targetSuffix: "_A",
          excludeIfReached: true,
        },
        {
          targetSuffix: "_B",
          excludeIfReached: false,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * GRP_EXP_TWO_DP_TARGETB_TRUE
   */
  {
    id: ExcludeIfReachedTestNames.GRP_EXP_TWO_DP_TARGETB_TRUE,
    description:
      "Group Assignment, Experiment Consistency, Two Decision Point Experiment (exclude_if_reached is true for target B)",
    assertions:
      AssertionProfile.NO_EXCLUSIONS_ABE_AND_BORT_CONDITTIONS_MATCH_CHAZ_AND_DALE_CONDITIONS_MATCH,
    experiment: {
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
          targetSuffix: "_A",
          excludeIfReached: false,
        },
        {
          targetSuffix: "_B",
          excludeIfReached: true,
        },
      ],
    },
  },
];
