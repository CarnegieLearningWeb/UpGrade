import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { SEGMENT_TYPE } from 'upgrade_types';

class Group {
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
