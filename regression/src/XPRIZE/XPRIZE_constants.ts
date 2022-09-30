import { ConditionCode } from "../constants";
import { ParentConditionAliasMap } from "../mocks/SpecsDetails";

export const XPRIZE_Condition = {
  CONTROL: "control",
  NOTIFICATION: "notification_variant",
  NON_NOTIFICATION: "non_notification_variant",
};

export const XPRIZE_Decision_Point_Target = {
  DIRECT_VARIATION_EQUATION: "direct_variation_equation",
  DIRECT_VARIATION_CONVERT: "direct_variation_convert",
  EQUIVALENT_RATIOS_RATES_DNL: "equivalent_ratios_rates_dnl",
  EQUIVALENT_RATIOS_RATES_TABLES: "equivalent_ratios_rates_table",
  PARTS_OF_GROUPS_1: "parts_of_groups_1",
  PARTS_OF_GROUPS_2: "parts_of_groups_2",
  PARTS_OF_GROUPS_3: "parts_of_groups_3",
  COMPARE_FUNCTIONS_DIFF_REPS_PROPORTIONAL:
    "compare_functions_diff_reps_proportional",
};

export const XPRIZE_Condition_Aliases = {
  PROMPT_DIRECT_VARIATION_EQUATION:
    "direct_variation_equation_prompt_xprize_indianriver",
  NO_PROMPT_DIRECT_VARIATION_EQUATION:
    "direct_variation_equation_xprize_indianriver",
  PROMPT_DIRECT_VARIATION_CONVERT:
    "direct_variation_convert_prompt_xprize_indianriver",
  NO_PROMPT_DIRECT_VARIATION_CONVERT:
    "direct_variation_convert_xprize_indianriver",
  PROMPT_EQUIVALENT_RATIOS_RATES_DNL:
    "equivalent_ratios_rates_dnl_prompt_xprize_indianriver",
  NO_PROMPT_EQUIVALENT_RATIOS_RATES_DNL:
    "equivalent_ratios_rates_dnl_xprize_indianriver",
  PROMPT_EQUIVALENT_RATIOS_RATES_TABLES:
    "equivalent_ratios_rates_table_prompt_xprize_indianriver",
  NO_PROMPT_EQUIVALENT_RATIOS_RATES_TABLES:
    "equivalent_ratios_rates_table_xprize_indianriver",
  PROMPT_PARTS_OF_GROUPS_1: "parts_of_groups_1_prompt_xprize_indianriver",
  NO_PROMPT_PARTS_OF_GROUPS_1: "parts_of_groups_1_xprize_indianriver",
  PROMPT_PARTS_OF_GROUPS_2: "parts_of_groups_2_prompt_xprize_indianriver",
  NO_PROMPT_PARTS_OF_GROUPS_2: "parts_of_groups_2_xprize_indianriver",
  PROMPT_PARTS_OF_GROUPS_3: "parts_of_groups_3_prompt_xprize_indianriver",
  NO_PROMPT_PARTS_OF_GROUPS_3: "parts_of_groups_3_xprize_indianriver",
  PROMPT_COMPARE_FUNCTIONS_DIFF_REPS_PROPORTIONAL:
    "compare_functions_diff_reps_proportional_prompt_xprize_indianriver",
  NO_PROMPT_COMPARE_FUNCTIONS_DIFF_REPS_PROPORTIONAL:
    "compare_functions_diff_reps_proportional_xprize_indianriver",
};

export const XPRIZE_ParentCondition_Alias_Map: ParentConditionAliasMap = {
  [XPRIZE_Condition_Aliases.PROMPT_COMPARE_FUNCTIONS_DIFF_REPS_PROPORTIONAL]:
    XPRIZE_Condition.NOTIFICATION,
  [XPRIZE_Condition_Aliases.PROMPT_DIRECT_VARIATION_CONVERT]:
    XPRIZE_Condition.NOTIFICATION,
  [XPRIZE_Condition_Aliases.PROMPT_DIRECT_VARIATION_EQUATION]:
    XPRIZE_Condition.NOTIFICATION,
  [XPRIZE_Condition_Aliases.PROMPT_EQUIVALENT_RATIOS_RATES_DNL]:
    XPRIZE_Condition.NOTIFICATION,
  [XPRIZE_Condition_Aliases.PROMPT_EQUIVALENT_RATIOS_RATES_TABLES]:
    XPRIZE_Condition.NOTIFICATION,
  [XPRIZE_Condition_Aliases.PROMPT_PARTS_OF_GROUPS_1]:
    XPRIZE_Condition.NOTIFICATION,
  [XPRIZE_Condition_Aliases.PROMPT_PARTS_OF_GROUPS_2]:
    XPRIZE_Condition.NOTIFICATION,
  [XPRIZE_Condition_Aliases.PROMPT_PARTS_OF_GROUPS_3]:
    XPRIZE_Condition.NOTIFICATION,
  [XPRIZE_Condition_Aliases.NO_PROMPT_COMPARE_FUNCTIONS_DIFF_REPS_PROPORTIONAL]:
    XPRIZE_Condition.NON_NOTIFICATION,
  [XPRIZE_Condition_Aliases.NO_PROMPT_DIRECT_VARIATION_CONVERT]:
    XPRIZE_Condition.NON_NOTIFICATION,
  [XPRIZE_Condition_Aliases.NO_PROMPT_DIRECT_VARIATION_EQUATION]:
    XPRIZE_Condition.NON_NOTIFICATION,
  [XPRIZE_Condition_Aliases.NO_PROMPT_EQUIVALENT_RATIOS_RATES_DNL]:
    XPRIZE_Condition.NON_NOTIFICATION,
  [XPRIZE_Condition_Aliases.NO_PROMPT_EQUIVALENT_RATIOS_RATES_TABLES]:
    XPRIZE_Condition.NON_NOTIFICATION,
  [XPRIZE_Condition_Aliases.NO_PROMPT_PARTS_OF_GROUPS_1]:
    XPRIZE_Condition.NON_NOTIFICATION,
  [XPRIZE_Condition_Aliases.NO_PROMPT_PARTS_OF_GROUPS_2]:
    XPRIZE_Condition.NON_NOTIFICATION,
  [XPRIZE_Condition_Aliases.NO_PROMPT_PARTS_OF_GROUPS_3]:
    XPRIZE_Condition.NON_NOTIFICATION,
  [XPRIZE_Condition.CONTROL]: XPRIZE_Condition.CONTROL,
  [ConditionCode.DEFAULT]: ConditionCode.DEFAULT,
};

export const XPRIZE_ASSERTION = {
  ANY_XPRIZE_CONDITION:
    "control or notification_variant or non_notification_variant",
};
