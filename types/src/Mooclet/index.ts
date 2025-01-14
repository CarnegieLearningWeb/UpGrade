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

export {
  MOOCLET_POLICY_SCHEMA_MAP,
  Prior,
  CurrentPosteriors,
  MoocletPolicyParametersDTO,
  MoocletTSConfigurablePolicyParametersDTO,
};
