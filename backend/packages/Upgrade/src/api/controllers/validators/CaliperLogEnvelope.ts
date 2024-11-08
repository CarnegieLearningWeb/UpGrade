import { IsNotEmpty, IsString } from 'class-validator';
import { CaliperLogData } from './CaliperLogData';

export class CaliperLogEnvelope {
  @IsNotEmpty()
  @IsString()
  public sensor: string;

  @IsNotEmpty()
  @IsString()
  public sendTime: string;

  @IsNotEmpty()
  @IsString()
  public dataVersion: string;

  public data: CaliperLogData[];
}
