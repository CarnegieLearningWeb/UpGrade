import { IsNumber, IsNotEmpty } from 'class-validator';
export class LogParamsValidator {
  @IsNumber()
  @IsNotEmpty()
  public skip: number;

  @IsNumber()
  @IsNotEmpty()
  public take: number;
}
