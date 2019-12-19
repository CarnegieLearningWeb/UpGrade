import { IsNotEmpty, IsDefined } from 'class-validator';

export class ExperimentSegmentValidator {
  public id: string;
  public point: string;

  @IsNotEmpty()
  @IsDefined()
  public name: string;

  public description: string;
}
