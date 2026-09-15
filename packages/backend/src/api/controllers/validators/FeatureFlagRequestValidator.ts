import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsObject,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';

export const MAX_SUB_GROUPSETS = 50;

export type IGetAllFeatureFlagsRequestBody =
  | {
      context: string;
    }
  | {
      /** @deprecated Use `useSingleGroupSet` instead. */
      context: string;
      groupsForSession: Record<string, string[]>;
      includeStoredUserGroups: boolean;
    }
  | {
      context: string;
      useSingleGroupSet: { groups: Record<string, string[]>; includeStoredUserGroups?: boolean };
    }
  | {
      context: string;
      useMultipleGroupSets: {
        mainGroupset?: { groups: Record<string, string[]>; includeStoredUserGroups?: boolean };
        subGroupsets: { groupsetId: string; groups: Record<string, string[]>; includeStoredUserGroups?: boolean }[];
      };
    };

// Custom validation decorator to ensure both dev-era top-level session properties are provided
// together — kept exactly as-is for the deprecated groupsForSession/includeStoredUserGroups path,
// since existing callers (e.g. the Java/Python client libraries) already always pass both.
const BothSessionPropertiesRequired = (validationOptions?: ValidationOptions) => {
  const registerBothSessionPropertiesRequired = (object: object, propertyName: string) => {
    registerDecorator({
      name: 'bothSessionPropertiesRequired',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          const hasProvideGroups = obj.groupsForSession !== undefined;
          const hasIncludeStored = obj.includeStoredUserGroups !== undefined;

          // Both must be provided together, or neither
          return (hasProvideGroups && hasIncludeStored) || (!hasProvideGroups && !hasIncludeStored);
        },
        defaultMessage() {
          return 'Both groupsForSession and includeStoredUserGroups must be provided together, or neither should be provided';
        },
      },
    });
  };

  return registerBothSessionPropertiesRequired;
};

// Custom validation decorator to ensure exactly one (or none) of the top-level configuration
// shapes is provided: the deprecated groupsForSession/includeStoredUserGroups pair,
// useSingleGroupSet, or useMultipleGroupSets. Mixing shapes on the same request is ambiguous.
const OnlyOneGroupConfigShape = (validationOptions?: ValidationOptions) => {
  const registerOnlyOneGroupConfigShape = (object: object, propertyName: string) => {
    registerDecorator({
      name: 'onlyOneGroupConfigShape',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          const shapesProvided = [
            obj.groupsForSession !== undefined || obj.includeStoredUserGroups !== undefined,
            obj.useSingleGroupSet !== undefined,
            obj.useMultipleGroupSets !== undefined,
          ].filter(Boolean).length;
          return shapesProvided <= 1;
        },
        defaultMessage() {
          return 'Provide at most one of: the deprecated groupsForSession/includeStoredUserGroups, useSingleGroupSet, or useMultipleGroupSets';
        },
      },
    });
  };

  return registerOnlyOneGroupConfigShape;
};

// Custom validation decorator to ensure every subGroupsets entry has a unique groupsetId, since
// callers use that id as the key to retrieve their result.
const UniqueSubGroupsetIds = (validationOptions?: ValidationOptions) => {
  const registerUniqueSubGroupsetIds = (object: object, propertyName: string) => {
    registerDecorator({
      name: 'uniqueSubGroupsetIds',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (!Array.isArray(value)) {
            return true;
          }
          const ids = value.map((entry) => entry?.groupsetId).filter((id) => id !== undefined);
          return ids.length === new Set(ids).size;
        },
        defaultMessage() {
          return 'subGroupsets groupsetId values must be unique';
        },
      },
    });
  };

  return registerUniqueSubGroupsetIds;
};

// Custom validation decorator to cap the number of subGroupsets entries in one request. A custom
// decorator (rather than the built-in ArrayMaxSize) is used so the error message can name the
// actual count sent, not just the limit.
const MaxSubGroupsetsAllowed = (max: number, validationOptions?: ValidationOptions) => {
  const registerMaxSubGroupsetsAllowed = (object: object, propertyName: string) => {
    registerDecorator({
      name: 'maxSubGroupsetsAllowed',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [max],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return !Array.isArray(value) || value.length <= max;
        },
        defaultMessage(args: ValidationArguments) {
          const count = Array.isArray(args.value) ? args.value.length : 0;
          return `Received ${count} subGroupsets, which exceeds the maximum of ${max} allowed`;
        },
      },
    });
  };

  return registerMaxSubGroupsetsAllowed;
};

export class SingleGroupSetValidator {
  @IsNotEmpty()
  @IsObject()
  public groups: Record<string, string[]>;

  /** Optional. Defaults to `false` (ephemeral) when omitted. */
  @IsOptional()
  @IsBoolean()
  public includeStoredUserGroups?: boolean;
}

export class SubGroupSetValidator extends SingleGroupSetValidator {
  @IsNotEmpty()
  @IsString()
  public groupsetId: string;
}

export class MultipleGroupSetsValidator {
  @IsOptional()
  @ValidateNested()
  @Type(() => SingleGroupSetValidator)
  public mainGroupset?: SingleGroupSetValidator;

  @IsArray()
  @ArrayMinSize(1)
  @MaxSubGroupsetsAllowed(MAX_SUB_GROUPSETS)
  @ValidateNested({ each: true })
  @Type(() => SubGroupSetValidator)
  @UniqueSubGroupsetIds()
  public subGroupsets: SubGroupSetValidator[];
}

export class FeatureFlagRequestValidator {
  @IsNotEmpty()
  @IsString()
  public context: string;

  /** @deprecated Use `useSingleGroupSet` instead. */
  @IsOptional()
  @IsObject()
  @BothSessionPropertiesRequired()
  @OnlyOneGroupConfigShape()
  public groupsForSession?: Record<string, string[]>;

  /** @deprecated Use `useSingleGroupSet` instead. */
  @IsOptional()
  @IsBoolean()
  @BothSessionPropertiesRequired()
  @OnlyOneGroupConfigShape()
  public includeStoredUserGroups?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => SingleGroupSetValidator)
  @OnlyOneGroupConfigShape()
  public useSingleGroupSet?: SingleGroupSetValidator;

  @IsOptional()
  @ValidateNested()
  @Type(() => MultipleGroupSetsValidator)
  @OnlyOneGroupConfigShape()
  public useMultipleGroupSets?: MultipleGroupSetsValidator;
}
