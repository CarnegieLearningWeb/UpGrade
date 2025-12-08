import { IsNotEmpty, IsIn, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { BinaryRewardAllowedValue } from 'upgrade_types';

// Custom validator specific to RewardValidator
function RequireDecisionPointOrExperimentId(validationOptions?: ValidationOptions) {
  return function (target: RewardValidator, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(_: any, args: ValidationArguments) {
          const request = args.object as RewardValidator;
          const hasSecondaryLookupDetails = request.decisionPoint && request.context;
          return !!(request.experimentId || hasSecondaryLookupDetails);
        },
        defaultMessage() {
          return 'experimentId or secondary lookup details (context and decisionPoint) must be provided.';
        },
      },
    });
  };
}

export class RewardValidator {
  @IsNotEmpty()
  @IsIn([BinaryRewardAllowedValue.SUCCESS, BinaryRewardAllowedValue.FAILURE])
  public rewardValue: BinaryRewardAllowedValue;

  // this decorator will check for existence of either experimentId or (context and decisionPoint)
  @RequireDecisionPointOrExperimentId()
  public experimentId: string;

  public context: string;

  public decisionPoint: {
    site: string;
    target: string;
  };
}
