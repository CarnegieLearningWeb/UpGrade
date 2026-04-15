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

enum BinaryRewardAllowedValue {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
}

const BinaryRewardValueMap = {
  [BinaryRewardAllowedValue.SUCCESS]: 1,
  [BinaryRewardAllowedValue.FAILURE]: 0,
};

interface ExperimentRewardsByCondition {
  conditionCode: string;
  successes: number;
  failures: number;
  successRate: string;
  order: number;
  estimatedWeight?: number;
  priorSuccess?: number;
  priorFailure?: number;
  posteriorSuccesses?: number;
  posteriorFailures?: number;
}

type ExperimentRewardsSummary = Array<ExperimentRewardsByCondition>;

export {
  MOOCLET_POLICY_SCHEMA_MAP,
  SUPPORTED_MOOCLET_ALGORITHMS,
  Prior,
  CurrentPosteriors,
  MoocletPolicyParametersDTO,
  MoocletTSConfigurablePolicyParametersDTO,
  BinaryRewardAllowedValue,
  BinaryRewardValueMap,
  ExperimentRewardsSummary,
  ExperimentRewardsByCondition,
};
