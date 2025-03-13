import {
  IsNumber,
  IsString,
  ValidateNested,
  IsOptional,
  registerDecorator,
  IsDefined,
  IsNotEmpty,
  ValidationOptions,
  validate as CVValidate,
  validateSync as CVValidateSync,
} from 'class-validator';
import { plainToClass, Type } from 'class-transformer';
import { MoocletPolicyParametersDTO } from './MoocletPolicyParametersDTO';

export class Prior {
  @IsDefined()
  @IsNumber()
  failure: number;

  @IsDefined()
  @IsNumber()
  success: number;
}

export class CurrentPosteriors {
  @IsDefined()
  @IsNumber()
  failures: number;

  @IsDefined()
  @IsNumber()
  successes: number;
}

const IsCurrentPosteriorsRecord = (validationOptions?: ValidationOptions) => {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'IsCurrentPosteriorsRecord',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: ({ value }) => {
          const errors = Object.values(value).map((val) => {
            const instance = plainToClass(CurrentPosteriors, val);
            return CVValidateSync(instance);
          });
          // Flat the array of arrays
          return errors.reduce((acc, val) => acc.concat(val), [])[0].toString();
        },
        ...validationOptions,
      },
      validator: {
        async validate(value: unknown) {
          return Promise.all(
            Object.values(value).map(async (val) => {
              const instance = plainToClass(CurrentPosteriors, val);
              return await CVValidate(instance).then((errors) => errors.length === 0);
            })
          ).then((values) => values.every((val) => val));
        },
      },
    });
  };
};

export class MoocletTSConfigurablePolicyParametersDTO extends MoocletPolicyParametersDTO {
  @IsDefined()
  @ValidateNested()
  @Type(() => Prior)
  prior: Prior;

  @IsOptional()
  @IsCurrentPosteriorsRecord()
  current_posteriors?: Record<string, CurrentPosteriors>;

  @IsNumber()
  batch_size = 1;

  @IsNumber()
  max_rating = 1;

  @IsNumber()
  min_rating = 0;

  @IsNumber()
  uniform_threshold = 0;

  @IsNumber()
  tspostdiff_thresh = 0;

  @IsNotEmpty()
  @IsString()
  outcome_variable_name = '';
}
