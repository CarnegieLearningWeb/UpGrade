import { Type } from 'class-transformer';
import { IsNotEmpty, IsDefined, IsString, ValidateNested, IsArray, IsOptional, IsObject } from 'class-validator';

class ILogGroupMetrics {
  @IsString()
  @IsNotEmpty()
  groupClass: string;

  @IsString()
  @IsNotEmpty()
  groupKey: string;

  @IsString()
  @IsNotEmpty()
  groupUniquifier: string;

  @IsObject()
  attributes: any;
}

class ILogMetrics {
  @IsOptional()
  @IsObject()
  attributes: any;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ILogGroupMetrics)
  groupedMetrics: ILogGroupMetrics[];
}

class ILogInput {
  @IsString()
  @IsNotEmpty()
  timestamp: string;

  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ILogMetrics)
  metrics: ILogMetrics;
}

export class LogValidator {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  public userId: string;

  @IsDefined()
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ILogInput)
  public value: ILogInput[];
}
