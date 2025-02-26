import 'reflect-metadata';
import { ASSIGNMENT_ALGORITHM } from '../Experiment/enums';
import {
  CurrentPosteriors,
  MoocletTSConfigurablePolicyParametersDTO,
  Prior,
} from './MoocletTSConfigurablePolicyParametersDTO';
import { MoocletPolicyParametersDTO } from './MoocletPolicyParametersDTO';

const MOOCLET_POLICY_SCHEMA_MAP = {
  [ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE]: MoocletTSConfigurablePolicyParametersDTO,
};

const SUPPORTED_MOOCLET_ALGORITHMS = Object.keys(MOOCLET_POLICY_SCHEMA_MAP);

enum BinaryRewardMetricAllowedValue {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
}

export type BinaryRewardMetricAllowedValueType =
  (typeof BinaryRewardMetricAllowedValue)[keyof typeof BinaryRewardMetricAllowedValue];

const BinaryRewardMetricValueMap = {
  [BinaryRewardMetricAllowedValue.SUCCESS]: 1,
  [BinaryRewardMetricAllowedValue.FAILURE]: 0,
};

export {
  MOOCLET_POLICY_SCHEMA_MAP,
  SUPPORTED_MOOCLET_ALGORITHMS,
  Prior,
  CurrentPosteriors,
  MoocletPolicyParametersDTO,
  MoocletTSConfigurablePolicyParametersDTO,
  BinaryRewardMetricAllowedValue,
  BinaryRewardMetricValueMap,
};
