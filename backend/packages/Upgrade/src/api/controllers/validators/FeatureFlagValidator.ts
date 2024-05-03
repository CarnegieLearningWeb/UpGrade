import { IsNotEmpty, IsDefined, IsString, IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { ParticipantsValidator } from '../../DTO/ExperimentDTO';
import { Column } from 'typeorm';
import { FILTER_MODE } from 'upgrade_types';
import { FEATURE_FLAG_STATUS } from 'upgrade_types';
import { Type } from 'class-transformer';

export class FeatureFlagValidation {
  @IsOptional()
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
  @Column('text', { array: true })
  @IsDefined()
  @IsEnum(FILTER_MODE)
  filterMode: FILTER_MODE;

  @IsNotEmpty()
  @IsArray()
  public context: string[];

  @IsNotEmpty()
  @IsArray()
  public tags: string[];

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ParticipantsValidator)
  public featureFlagSegmentInclusion: ParticipantsValidator;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ParticipantsValidator)
  public featureFlagSegmentExclusion: ParticipantsValidator;
}
