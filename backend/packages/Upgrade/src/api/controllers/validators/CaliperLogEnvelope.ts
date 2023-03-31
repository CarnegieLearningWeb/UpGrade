import { IsNotEmpty, IsDefined, IsString } from 'class-validator';
import { CaliperLogData } from './CaliperLogData';


export class CaliperLogEnvelope {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  public sensor: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  public sendTime: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  public dataVersion: string;

  public data: CaliperLogData[];
}