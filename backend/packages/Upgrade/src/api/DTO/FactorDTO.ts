import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { LevelDTO } from './LevelDTO';

export class FactorDTO {
  public id: string;

  @IsNotEmpty()
  @IsString()
  public name: string;

  @IsNumber()
  public order: number;

  @IsString()
  public description: string;

  public levels: LevelDTO[];
}
