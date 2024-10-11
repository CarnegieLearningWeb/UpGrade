import { Type } from 'class-transformer';
import { IsArray, IsDefined, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { SEGMENT_TYPE } from 'upgrade_types';

export class Group {
  @IsNotEmpty()
  @IsString()
  groupId: string;

  @IsNotEmpty()
  @IsString()
  type: string;
}
export class SegmentInputValidator {
  @IsOptional()
  @IsUUID()
  @IsString()
  public id?: string;

  @IsNotEmpty()
  @IsString()
  public name: string;

  @IsString()
  @IsOptional()
  public description?: string;

  @IsNotEmpty()
  @IsString()
  public context: string;

  @IsNotEmpty()
  @IsEnum(SEGMENT_TYPE)
  public type: SEGMENT_TYPE;

  @IsArray()
  @IsString({ each: true })
  public userIds: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Group)
  public groups: Group[];

  @IsArray()
  @IsString({ each: true })
  public subSegmentIds: string[];
}

export class IdValidator {
  @IsNotEmpty()
  @IsDefined()
  @IsUUID()
  public segmentId: string;
}

export class SegmentValidationObj {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentInputValidator)
  segments: SegmentInputValidator[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentImportError)
  importErrors: SegmentImportError[];
}

export class SegmentImportError {
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @IsString()
  error: string;
}

export class SegmentFile {
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @IsNotEmpty()
  @IsString()
  fileContent: string;
}

export class SegmentIds {
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  @IsUUID('all', { each: true })
  public ids: string[];
}
