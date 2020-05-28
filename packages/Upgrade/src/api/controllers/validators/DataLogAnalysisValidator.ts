import { IsNotEmpty, IsString, IsDefined, IsJSON } from 'class-validator';
import { OPERATION_TYPES } from 'upgrade_types';

export class DataLogAnalysisValidator {
  @IsString()
  @IsNotEmpty()
  @IsDefined()
  public experimentId: string;

  @IsString({ each: true })
  @IsDefined()
  @IsNotEmpty()
  public metrics: string[];

  @IsNotEmpty()
  @IsDefined()
  public operationTypes: OPERATION_TYPES;

  @IsJSON()
  @IsDefined()
  @IsNotEmpty()
  public timeRange: { from: Date; to: Date };

  // filter by

  // group by
}
