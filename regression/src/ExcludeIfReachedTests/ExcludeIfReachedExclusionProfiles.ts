import { ConditionAssertion } from "../constants";

/**
 * ABE will always mark decision point target A before enrollment
 *
 * ABE and BORT are in group 1 for group assignments
 * CHAZ and DALE are in group 2 for group assignments
 */

export const ExcludeIfReachedAssertionProfiles = {
  NO_EXCLUSIONS_ALL_GET_INDEPENDENT_CONDITION: {
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
  ABE_EXCLUDED_OTHERS_GET_INDEPENDENT_CONDITION: {
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
  ABE_EXCLUDED_BORT_INDEPENDENT_CONDITION_CHAZ_AND_DALE_CONDITIONS_MATCH: {
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
  NO_EXCLUSIONS_ABE_AND_BORT_CONDITTIONS_MATCH_CHAZ_AND_DALE_CONDITIONS_MATCH: {
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
  ABE_AND_BORT_EXCLUDED_CHAZ_AND_DALE_MATCH_CONDITIONS: {
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
};
