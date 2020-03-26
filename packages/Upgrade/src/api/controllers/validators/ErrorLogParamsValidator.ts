import { IsNumber, IsNotEmpty } from 'class-validator';
import { Column } from 'typeorm';
import { SERVER_ERROR } from 'ees_types';
export class ErrorLogParamsValidator {
  @IsNumber()
  @IsNotEmpty()
  public skip: number;

  @IsNumber()
  @IsNotEmpty()
  public take: number;

  @Column({ nullable: true })
  public filter: SERVER_ERROR;
}
