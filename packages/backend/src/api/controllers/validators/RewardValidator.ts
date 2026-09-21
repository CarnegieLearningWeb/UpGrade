import { Transform, plainToInstance } from 'class-transformer';
import {
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { BinaryRewardAllowedValue } from 'upgrade_types';

class DecisionPointValidator {
  @IsString()
  @IsNotEmpty()
  public site: string;

  @IsString()
  public target: string;
}

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

  @IsOptional()
  @IsString()
  public context: string;

  @IsOptional()
  @ValidateNested()
  @Transform(({ value }) =>
    value ? plainToInstance(DecisionPointValidator, { ...value, target: value.target ?? '' }) : value
  )
  public decisionPoint: DecisionPointValidator;
}
