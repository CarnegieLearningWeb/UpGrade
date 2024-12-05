import 'reflect-metadata';
import { ASSIGNMENT_ALGORITHM } from "../Experiment/enums";
import { MoocletTSConfigurablePolicyParametersDTO } from "./MoocletTSConfigurablePolicyParametersDTO";

const MOOCLET_POLICY_SCHEMA_MAP = {
    [ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE]: MoocletTSConfigurablePolicyParametersDTO
}

export {
    MOOCLET_POLICY_SCHEMA_MAP,
    MoocletTSConfigurablePolicyParametersDTO
}
