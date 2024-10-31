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
    version_json?: Record<string, 0 | 1>;
}

export interface MoocletVersionResponseDetails {
    id: number;
    name: string;
    mooclet: number;
    version_id?: number;
    text?: string;
    version_json?: Record<string, 0 | 1>;
}

export interface MoocletPolicyParametersRequestBody {
    mooclet: number;
    policy: number;
    parameters: MoocletPolicyParameters;
}

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

export interface MoocletTSConfigurablePolicyParameters {
    prior: {
        failure: number; // use 1 as default
        success: number; // use 1 as default
    };
    // current_posteriors will show up after first reward is given
    // BUT if you wanted to set different priors for different arms, you could do that by setting current_posteriors manually
    current_posteriors?: MoocletTSConfigurableCurrentPosteriors;
    batch_size: number; // for now leave at 1
    max_rating: number; // leave at 1
    min_rating: number; // leave at 0
    uniform_threshold: number; // leave at 0
    tspostdiff_thresh: number; // ignore this (or leave at 0)
    outcome_variable_name: string;
}

export interface MoocletTSConfigurableCurrentPosteriors {
    [key: string]: {
        failures: number;
        successes: number;
    };
}

// this will be a Union type of all possible policy parameters once more are introduced
export type MoocletPolicyParameters = MoocletTSConfigurablePolicyParameters;

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
