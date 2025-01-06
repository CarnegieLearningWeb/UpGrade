import { IsDefined, IsIn, IsNumber } from 'class-validator';
import { ASSIGNMENT_ALGORITHM } from 'types/src';

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
  version_json?: Record<string, number>;
}

export interface MoocletVersionResponseDetails {
  id: number;
  name: string;
  mooclet: number;
  version_id?: number;
  text?: string;
  version_json?: Record<string, number>;
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

export interface MoocletPolicyResponseDetails {
  id: number;
  name: string;
  environment?: string;
}

export interface MoocletBatchResponse<T> {
  count: number;
  next: string;
  previous: string;
  results: T[];
}
