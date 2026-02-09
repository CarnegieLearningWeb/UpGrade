import { IsNumber, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { SERVER_ERROR } from 'upgrade_types';
export class ErrorLogParamsValidator {
  @IsNumber()
  @IsNotEmpty()
  public skip: number;

  @IsNumber()
  @IsNotEmpty()
  public take: number;

  @IsEnum(SERVER_ERROR)
  @IsOptional()
  public filter?: SERVER_ERROR;
}
