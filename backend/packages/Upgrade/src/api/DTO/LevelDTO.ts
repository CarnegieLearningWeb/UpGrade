import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { PAYLOAD_TYPE } from 'upgrade_types';

export class LevelDTO {
  public id: string;

  @IsNotEmpty()
  @IsString()
  public name: string;

  @IsString()
  public description: string;

  public payload: { type: PAYLOAD_TYPE; value: string };

  @IsNumber()
  public order: number;
}
