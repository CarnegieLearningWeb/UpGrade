import { IsArray, IsEnum, IsNotEmpty, IsString, IsUUID } from "class-validator";
import { SEGMENT_TYPE } from "upgrade_types";

export class SegmentInputValidator {

  @IsUUID()
  public id: string;

  @IsNotEmpty()
  @IsString()
  public name: string;

  @IsString()
  public description: string;

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
  public groups: {groupId:string, type:string}[];

  @IsArray()
  @IsString({ each: true })
  public subSegmentIds: string[];
}