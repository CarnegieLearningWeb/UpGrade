import { AssignmentUnit, ConsistencyRule } from "../constants";
import {
  XPRIZE_ASSERTION,
  XPRIZE_ParentCondition_Alias_Map,
  XPRIZE_Condition,
  XPRIZE_Decision_Point_Target,
  XPRIZE_Condition_Aliases,
} from "./XPRIZE_constants";

export const XPRIZE_TestNames = {
  XPRIZE_INDIAN_RIVER: "XPRIZE_INDIAN_RIVER",
  XPRIZE_INDIAN_RIVER_NO_ALIASES: "XPRIZE_INDIAN_RIVER_NO_ALIASES",
};

export const XPRIZE_TestScenarios = [
  /*******************************************************************************************************************************
   * XPRIZE_INDIAN_RIVER
   */
  {
    id: XPRIZE_TestNames.XPRIZE_INDIAN_RIVER,
    description:
      "Individual Assignment, Individual Consistency, 8 Decision Point Experiment, 3 Conditions (exclude_if_reached is false for all)",
    assertions: {
      ABE: {
        conditionShouldBe: XPRIZE_ASSERTION.ANY_XPRIZE_CONDITION,
        conditionShouldMatchUser: null,
      },
      BORT: {
        conditionShouldBe: XPRIZE_ASSERTION.ANY_XPRIZE_CONDITION,
        conditionShouldMatchUser: null,
      },
      CHAZ: {
        conditionShouldBe: XPRIZE_ASSERTION.ANY_XPRIZE_CONDITION,
        conditionShouldMatchUser: null,
      },
      DALE: {
        conditionShouldBe: XPRIZE_ASSERTION.ANY_XPRIZE_CONDITION,
        conditionShouldMatchUser: null,
      },
    },
    options: {
      useParentConditionAliasMap: XPRIZE_ParentCondition_Alias_Map,
      useCustomAssertion: XPRIZE_ASSERTION.ANY_XPRIZE_CONDITION,
    },
    experiment: {
      assignmentUnit: AssignmentUnit.INDIVIDUAL,
      consistencyRule: ConsistencyRule.INDIVIDUAL,
      conditions: [
        {
          conditionCode: XPRIZE_Condition.CONTROL,
        },
        {
          conditionCode: XPRIZE_Condition.NOTIFICATION,
        },
        {
          conditionCode: XPRIZE_Condition.NON_NOTIFICATION,
        },
      ],
      decisionPoints: [
        {
          targetSuffix:
            XPRIZE_Decision_Point_Target.COMPARE_FUNCTIONS_DIFF_REPS_PROPORTIONAL,
          excludeIfReached: false,
        },
        {
          targetSuffix: XPRIZE_Decision_Point_Target.DIRECT_VARIATION_CONVERT,
          excludeIfReached: false,
        },
        {
          targetSuffix: XPRIZE_Decision_Point_Target.DIRECT_VARIATION_EQUATION,
          excludeIfReached: false,
        },
        {
          targetSuffix:
            XPRIZE_Decision_Point_Target.EQUIVALENT_RATIOS_RATES_DNL,
          excludeIfReached: false,
        },
        {
          targetSuffix:
            XPRIZE_Decision_Point_Target.EQUIVALENT_RATIOS_RATES_TABLES,
          excludeIfReached: false,
        },
        {
          targetSuffix: XPRIZE_Decision_Point_Target.PARTS_OF_GROUPS_1,
          excludeIfReached: false,
        },
        {
          targetSuffix: XPRIZE_Decision_Point_Target.PARTS_OF_GROUPS_2,
          excludeIfReached: false,
        },
        {
          targetSuffix: XPRIZE_Decision_Point_Target.PARTS_OF_GROUPS_3,
          excludeIfReached: false,
        },
      ],
      conditionAliases: [
        {
          conditionCode: XPRIZE_Condition.NOTIFICATION,
          decisionPointTargetSuffix:
            XPRIZE_Decision_Point_Target.COMPARE_FUNCTIONS_DIFF_REPS_PROPORTIONAL,
          aliasName:
            XPRIZE_Condition_Aliases.PROMPT_COMPARE_FUNCTIONS_DIFF_REPS_PROPORTIONAL,
        },
        {
          conditionCode: XPRIZE_Condition.NON_NOTIFICATION,
          decisionPointTargetSuffix:
            XPRIZE_Decision_Point_Target.COMPARE_FUNCTIONS_DIFF_REPS_PROPORTIONAL,
          aliasName:
            XPRIZE_Condition_Aliases.NO_PROMPT_COMPARE_FUNCTIONS_DIFF_REPS_PROPORTIONAL,
        },
        {
          conditionCode: XPRIZE_Condition.NOTIFICATION,
          decisionPointTargetSuffix:
            XPRIZE_Decision_Point_Target.DIRECT_VARIATION_CONVERT,
          aliasName: XPRIZE_Condition_Aliases.PROMPT_DIRECT_VARIATION_CONVERT,
        },
        {
          conditionCode: XPRIZE_Condition.NON_NOTIFICATION,
          decisionPointTargetSuffix:
            XPRIZE_Decision_Point_Target.DIRECT_VARIATION_CONVERT,
          aliasName:
            XPRIZE_Condition_Aliases.NO_PROMPT_DIRECT_VARIATION_CONVERT,
        },
        {
          conditionCode: XPRIZE_Condition.NOTIFICATION,
          decisionPointTargetSuffix:
            XPRIZE_Decision_Point_Target.DIRECT_VARIATION_EQUATION,
          aliasName: XPRIZE_Condition_Aliases.PROMPT_DIRECT_VARIATION_EQUATION,
        },
        {
          conditionCode: XPRIZE_Condition.NON_NOTIFICATION,
          decisionPointTargetSuffix:
            XPRIZE_Decision_Point_Target.DIRECT_VARIATION_EQUATION,
          aliasName:
            XPRIZE_Condition_Aliases.NO_PROMPT_DIRECT_VARIATION_EQUATION,
        },
        {
          conditionCode: XPRIZE_Condition.NOTIFICATION,
          decisionPointTargetSuffix:
            XPRIZE_Decision_Point_Target.EQUIVALENT_RATIOS_RATES_DNL,
          aliasName:
            XPRIZE_Condition_Aliases.PROMPT_EQUIVALENT_RATIOS_RATES_DNL,
        },
        {
          conditionCode: XPRIZE_Condition.NON_NOTIFICATION,
          decisionPointTargetSuffix:
            XPRIZE_Decision_Point_Target.EQUIVALENT_RATIOS_RATES_DNL,
          aliasName:
            XPRIZE_Condition_Aliases.NO_PROMPT_EQUIVALENT_RATIOS_RATES_DNL,
        },
        {
          conditionCode: XPRIZE_Condition.NOTIFICATION,
          decisionPointTargetSuffix:
            XPRIZE_Decision_Point_Target.EQUIVALENT_RATIOS_RATES_TABLES,
          aliasName:
            XPRIZE_Condition_Aliases.PROMPT_EQUIVALENT_RATIOS_RATES_TABLES,
        },
        {
          conditionCode: XPRIZE_Condition.NON_NOTIFICATION,
          decisionPointTargetSuffix:
            XPRIZE_Decision_Point_Target.EQUIVALENT_RATIOS_RATES_TABLES,
          aliasName:
            XPRIZE_Condition_Aliases.NO_PROMPT_EQUIVALENT_RATIOS_RATES_TABLES,
        },
        {
          conditionCode: XPRIZE_Condition.NOTIFICATION,
          decisionPointTargetSuffix:
            XPRIZE_Decision_Point_Target.PARTS_OF_GROUPS_1,
          aliasName: XPRIZE_Condition_Aliases.PROMPT_PARTS_OF_GROUPS_1,
        },
        {
          conditionCode: XPRIZE_Condition.NON_NOTIFICATION,
          decisionPointTargetSuffix:
            XPRIZE_Decision_Point_Target.PARTS_OF_GROUPS_1,
          aliasName: XPRIZE_Condition_Aliases.NO_PROMPT_PARTS_OF_GROUPS_1,
        },
        {
          conditionCode: XPRIZE_Condition.NOTIFICATION,
          decisionPointTargetSuffix:
            XPRIZE_Decision_Point_Target.PARTS_OF_GROUPS_2,
          aliasName: XPRIZE_Condition_Aliases.PROMPT_PARTS_OF_GROUPS_2,
        },
        {
          conditionCode: XPRIZE_Condition.NON_NOTIFICATION,
          decisionPointTargetSuffix:
            XPRIZE_Decision_Point_Target.PARTS_OF_GROUPS_2,
          aliasName: XPRIZE_Condition_Aliases.NO_PROMPT_PARTS_OF_GROUPS_2,
        },
        {
          conditionCode: XPRIZE_Condition.NOTIFICATION,
          decisionPointTargetSuffix:
            XPRIZE_Decision_Point_Target.PARTS_OF_GROUPS_3,
          aliasName: XPRIZE_Condition_Aliases.PROMPT_PARTS_OF_GROUPS_3,
        },
        {
          conditionCode: XPRIZE_Condition.NON_NOTIFICATION,
          decisionPointTargetSuffix:
            XPRIZE_Decision_Point_Target.PARTS_OF_GROUPS_3,
          aliasName: XPRIZE_Condition_Aliases.NO_PROMPT_PARTS_OF_GROUPS_3,
        },
      ],
    },
  },
  /*******************************************************************************************************************************
   * XPRIZE_INDIAN_RIVER_NO_ALIASES
   */
  {
    id: XPRIZE_TestNames.XPRIZE_INDIAN_RIVER_NO_ALIASES,
    description:
      "Individual Assignment, Individual Consistency, 8 Decision Point Experiment, 3 Conditions (exclude_if_reached is false for all)",
    assertions: {
      ABE: {
        conditionShouldBe: XPRIZE_ASSERTION.ANY_XPRIZE_CONDITION,
        conditionShouldMatchUser: null,
      },
      BORT: {
        conditionShouldBe: XPRIZE_ASSERTION.ANY_XPRIZE_CONDITION,
        conditionShouldMatchUser: null,
      },
      CHAZ: {
        conditionShouldBe: XPRIZE_ASSERTION.ANY_XPRIZE_CONDITION,
        conditionShouldMatchUser: null,
      },
      DALE: {
        conditionShouldBe: XPRIZE_ASSERTION.ANY_XPRIZE_CONDITION,
        conditionShouldMatchUser: null,
      },
    },
    options: {
      useCustomAssertion: XPRIZE_ASSERTION.ANY_XPRIZE_CONDITION,
    },
    experiment: {
      assignmentUnit: AssignmentUnit.INDIVIDUAL,
      consistencyRule: ConsistencyRule.INDIVIDUAL,
      conditions: [
        {
          conditionCode: XPRIZE_Condition.CONTROL,
        },
        {
          conditionCode: XPRIZE_Condition.NOTIFICATION,
        },
        {
          conditionCode: XPRIZE_Condition.NON_NOTIFICATION,
        },
      ],
      decisionPoints: [
        {
          targetSuffix:
            XPRIZE_Decision_Point_Target.COMPARE_FUNCTIONS_DIFF_REPS_PROPORTIONAL,
          excludeIfReached: false,
        },
        {
          targetSuffix: XPRIZE_Decision_Point_Target.DIRECT_VARIATION_CONVERT,
          excludeIfReached: false,
        },
        {
          targetSuffix: XPRIZE_Decision_Point_Target.DIRECT_VARIATION_EQUATION,
          excludeIfReached: false,
        },
        {
          targetSuffix:
            XPRIZE_Decision_Point_Target.EQUIVALENT_RATIOS_RATES_DNL,
          excludeIfReached: false,
        },
        {
          targetSuffix:
            XPRIZE_Decision_Point_Target.EQUIVALENT_RATIOS_RATES_TABLES,
          excludeIfReached: false,
        },
        {
          targetSuffix: XPRIZE_Decision_Point_Target.PARTS_OF_GROUPS_1,
          excludeIfReached: false,
        },
        {
          targetSuffix: XPRIZE_Decision_Point_Target.PARTS_OF_GROUPS_2,
          excludeIfReached: false,
        },
        {
          targetSuffix: XPRIZE_Decision_Point_Target.PARTS_OF_GROUPS_3,
          excludeIfReached: false,
        },
      ],
    },
  },
];
