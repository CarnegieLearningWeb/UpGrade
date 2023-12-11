import { Optional } from '@nestjs/common';
import { IsJSON, IsString } from 'class-validator';

export class MoocletParamsValidator {
  @IsString()
  public method: string;

  @IsString()
  public url: string;

  @IsString()
  public apiToken: string;

  @IsJSON()
  @Optional()
  public body?: any;
}
