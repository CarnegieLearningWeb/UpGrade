import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class ExperimentIds {
  @IsArray()
  @IsNotEmpty()
  @IsUUID('all', { each: true })
  public ids: string[];
}
