import { IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ExperimentIds {
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  @IsUUID('all', { each: true })
  public ids: string[];
}
