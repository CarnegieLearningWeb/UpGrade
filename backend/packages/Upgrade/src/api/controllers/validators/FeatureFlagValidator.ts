import { IsNotEmpty, IsDefined, IsString, IsArray, IsEnum } from 'class-validator';
import { FILTER_MODE } from 'upgrade_types';
import { FEATURE_FLAG_STATUS } from 'upgrade_types';

export class FeatureFlagValidation {
  @IsNotEmpty()
  @IsDefined()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  key: string;

  @IsNotEmpty()
  @IsDefined()
  @IsEnum(FEATURE_FLAG_STATUS)
  status: FEATURE_FLAG_STATUS;

  @IsNotEmpty()
  @IsDefined()
  @IsEnum(FILTER_MODE)
  filterMode: FILTER_MODE;

  @IsNotEmpty()
  @IsArray()
  public context: string[];

  @IsNotEmpty()
  @IsArray()
  public tags: string[];
}
