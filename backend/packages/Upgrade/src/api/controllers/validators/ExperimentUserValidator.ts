import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  ValidationOptions,
  isObject,
  registerDecorator,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExperimentUser } from '../../../../src/api/models/ExperimentUser';

export const IsGroupRecord = (validationOptions?: ValidationOptions) => {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'IsGroupRecord',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: 'The Group is not a valid Record<string, string[]>',
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          if (!isObject(value)) return false;
          if (Object.keys(value).length === 0) return true;

          const keys = Object.keys(value);

          return keys.every((key) => {
            if (typeof key !== 'string' || key === '') return false;
            if (!Array.isArray(value[key])) return false;
            if (!value[key].every((val) => typeof val === 'string' && val !== '')) return false;

            return true;
          });
        },
      },
    });
  };
};

export const IsWorkingGroupRecord = (validationOptions?: ValidationOptions) => {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'IsWorkingGroupRecord',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: 'The WorkingGroup is not a valid Record<string, string>',
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          if (!isObject(value)) return false;
          if (Object.keys(value).length === 0) return true;

          const keys = Object.keys(value);

          return keys.every((key) => {
            if (typeof key !== 'string' || key === '') return false;
            if (typeof value[key] !== 'string' || value[key] === '') return false;

            return true;
          });
        },
      },
    });
  };
};

export class ExperimentUserValidatorv6 {
  @IsOptional()
  @IsGroupRecord()
  public group: Record<string, string[]>;

  @IsOptional()
  @IsWorkingGroupRecord()
  public workingGroup: Record<string, string>;
}

export class ExperimentUserValidator extends ExperimentUserValidatorv6 {
  @IsNotEmpty()
  @IsString()
  public id: string;
}

export class IdValidator {
  @IsNotEmpty()
  @IsString()
  public id: string;
}

export class ExperimentUserArrayValidator {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperimentUserValidator)
  public users: ExperimentUserValidator[];
}

export class RequestedExperimentUser extends ExperimentUser {
  requestedUserId: string;
}
