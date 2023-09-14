import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsDefined,
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  ValidateNested,
  ValidateIf,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { MARKED_DECISION_POINT_STATUS, PAYLOAD_TYPE } from 'upgrade_types';

const IsAssignedFactorRecord = (validationOptions?: ValidationOptions) => {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'IsAssignedFactorRecord',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: 'The assignedFactor is not a valid Record<string, AssignedFactor>',
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          return validateAssignedFactorData(value);
        },
      },
    });
  };
};

function validateAssignedFactorData(data: any): boolean {
  const keys = Object.keys(data);
  for (const key of keys) {
    const factor = data[key];
    if (!isValidAssignedFactor(factor)) {
      return false;
    }
  }
  return true;
}

function isValidAssignedFactor(value: any): value is AssignedFactor {
  return (
    typeof value === 'object' &&
    typeof value.level === 'string' &&
    (value.payload === null || isValidPayload(value.payload))
  );
}

function isValidPayload(value: any): value is Payload {
  return (
    typeof value === 'object' && Object.values(PAYLOAD_TYPE).includes(value.type) && typeof value.value === 'string'
  );
}

class Payload {
  @IsEnum(PAYLOAD_TYPE)
  type: PAYLOAD_TYPE;

  @IsString()
  value: string;
}

class AssignedFactor {
  @IsDefined()
  @IsString()
  level: string;

  @ValidateIf((object, value) => value !== null)
  @IsObject()
  @ValidateNested()
  @Type(() => Payload)
  payload: Payload | null;
}

class AssignedCondition {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  conditionCode?: string;

  @IsOptional()
  @IsString()
  experimentId?: string;
}

class Data {
  @IsString()
  @IsNotEmpty()
  @IsDefined()
  site: string;

  @IsString()
  target: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AssignedCondition)
  assignedCondition: AssignedCondition;

  @IsOptional()
  @IsAssignedFactorRecord()
  assignedFactor?: Record<string, AssignedFactor>;
}

export class MarkExperimentValidatorv5 {
  @IsNotEmpty()
  @IsDefined()
  public userId: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => Data)
  public data: Data;

  @IsEnum(MARKED_DECISION_POINT_STATUS)
  @IsOptional()
  public status?: MARKED_DECISION_POINT_STATUS;

  @IsString()
  @IsOptional()
  public uniquifier?: string;

  @IsString()
  @IsOptional()
  public clientError?: string;
}
