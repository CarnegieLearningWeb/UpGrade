import {
  IsNotEmpty,
  IsString,
  ValidateIf,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { Transform } from 'class-transformer';

function RequireSiteWhenTargetProvided(validationOptions?: ValidationOptions) {
  return function (target: ExperimentAssignmentValidatorv6, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const request = args.object as ExperimentAssignmentValidatorv6;
          if (value === undefined) {
            return true;
          }

          return request.site !== undefined;
        },
        defaultMessage() {
          return 'site must be provided when target is supplied.';
        },
      },
    });
  };
}

export class ExperimentAssignmentValidatorv6 {
  @IsNotEmpty()
  @IsString()
  public context: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  public site?: string;

  @RequireSiteWhenTargetProvided()
  @Transform(({ value, obj }) => (obj?.site !== undefined ? value ?? '' : value))
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  public target?: string;
}

export class ExperimentAssignmentValidator extends ExperimentAssignmentValidatorv6 {
  @IsNotEmpty()
  @IsString()
  public userId: string;
}
