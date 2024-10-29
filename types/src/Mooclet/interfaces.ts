/**********************************************************************
 * types for the Mooclet services. I don't know where to put these so they're here!
 */
export interface MoocletProxyRequestParams {
  method: string;
  url: string;
  apiToken: string;
  body?: MoocletRequestBody | MoocletPolicyParametersRequestBody | MoocletValueRequestBody | MoocletVariableRequestBody;
}

export interface MoocletRequestBody {
  name: string;
  policy: number;
}

export interface MoocletResponseDetails {
  id: number;
  name: string;
  policy: number;
  mooclet_id?: string;
  environment?: string;
}

export interface MoocletVersionRequestBody {
  mooclet: number;
  name: string;
  text?: string;
  version_json?: any;
}

export interface MoocletVersionResponseDetails {
  id: number;
  name: string;
  mooclet: number;
  version_id?: number;
  text?: string;
  version_json?: Record<keyof string, 0 | 1>;
}

export interface MoocletPolicyParametersRequestBody {
  mooclet: number;
  policy: number;
  parameters: MoocletPolicyParameters;
}

// {"probability_distribution": {"testtest_arm1": 0.7, "testtest_arm2": 0.3}} #weighted random
export interface MoocletPolicyParametersResponseDetails {
  id: number;
  mooclet: number;
  policy: number;
  parameters: MoocletPolicyParameters;
}

export interface MoocletVariableRequestBody {
  name: string;
}

export interface MoocletVariableResponseDetails {
  id: number;
  environment?: null;
  variable_id?: null;
  name: string;
  min_value: number;
  max_value: number;
  value_type: 'BIN'; // binary is only supported type, must use 0 or 1
  sample_thres: number;
}

export interface MoocletValueRequestBody {
  variable: string;
  learner?: number;
  value: number;
  mooclet: number;
  version: number;
  policy: number;
}

export interface MoocletValueResponseDetails {
  id: string;
  variable: string;
  learner: string;
  mooclet: number;
  version: number;
  policy: number;
  value: number;
  text: string;
  timestamp: string;
}

export interface ExperimentCondtitionToMoocletVersionParams {
  moocletId: number;
  userId: string;
  experimentConditions: any[]; // obviously shouldn't be any, but many experiment interfaces are missing from the types/Experiment/interfaces, not feeling like this is the place to update that...
}

export interface MoocletThompsonSamplingConfigurablePolicyParameters {
  prior: {
    failure: number; // use 1 as default
    success: number; // use 1 as default
  };
  // current_posteriors will show up after first reward is given
  // BUT if you wanted to set different priors for different arms, you could do that by setting current_posteriors manually
  current_posteriors?: MoocletThompsonSamplingConfigurableCurrentPosteriors;
  batch_size: number; // for now leave at 1
  max_rating: number; // leave at 1
  min_rating: number; // leave at 0
  uniform_threshold: number; // leave at 0
  tspostdiff_thresh: number; // ignore this (or leave at 0)
  outcome_variable_name: string;
}

export interface MoocletThompsonSamplingConfigurableCurrentPosteriors {
  [key: string]: {
    failures: number;
    successes: number;
  };
}

// This will be a union of all policy parameters types as we add more
export type MoocletPolicyParameters = MoocletThompsonSamplingConfigurablePolicyParameters;

export interface MoocletPolicyResponseDetails {
  id: number;
  name: string;
  environment?: string;
}

export interface MoocletDetails {
  readonly mooclet?: MoocletResponseDetails;
  readonly versions?: MoocletVersionResponseDetails[];
  policyParameters: MoocletPolicyParameters;
}

export interface MoocletBatchResponse<T> {
  count: number;
  next: string;
  previous: string;
  results: T[];
}

export enum SupportedMoocletPolicyNames {
  WEIGHTED_RANDOM = 'weighted_random',
  TS_CONFIGURABLE = 'ts_configurable',
}
