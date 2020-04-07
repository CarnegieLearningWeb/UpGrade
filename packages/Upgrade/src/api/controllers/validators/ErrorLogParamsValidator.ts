import { IsNumber, IsNotEmpty } from 'class-validator';
import { SERVER_ERROR } from 'ees_types';
export class ErrorLogParamsValidator {
  @IsNumber()
  @IsNotEmpty()
  public skip: number;

  @IsNumber()
  @IsNotEmpty()
  public take: number;

  public filter: SERVER_ERROR;
}
