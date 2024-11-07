import { plainToInstance, Type, Transform } from 'class-transformer';
import { validate } from 'class-validator';
import { ASSIGNMENT_ALGORITHM, MOOCLET_POLICY_SCHEMA_MAP } from 'upgrade_types';
export class MoocletPolicyParametersDTO {
  @Transform(({ value: policyParameters, obj: experiment }) => {
    const policyParameterSchema = MOOCLET_POLICY_SCHEMA_MAP[experiment.assignmentAlgorithm];
    if (!policyParameterSchema) {
      throw new Error('Invalid assignment algorithm: ' + experiment.assignmentAlgorithm);
    }
    return plainToInstance(policyParameterSchema, policyParameters);
  })
  @Type(() => Object)
  moocletPolicyParameters: any;
}

export async function validateMoocletPolicyParameters(assignmentAlgorithm: ASSIGNMENT_ALGORITHM, moocletPolicyParameters: any) {
  const moocletPolicyParametersDTO = plainToInstance(MoocletPolicyParametersDTO, { assignmentAlgorithm, moocletPolicyParameters });
  const errors = await validate(moocletPolicyParametersDTO.moocletPolicyParameters);

  if (errors.length > 0) {
    throw new Error(`Policy Parameter validation failed: ${errors}`);
  }

  return moocletPolicyParametersDTO.moocletPolicyParameters;
}