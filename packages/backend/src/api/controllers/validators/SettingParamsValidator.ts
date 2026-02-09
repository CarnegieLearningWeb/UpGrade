import { IsBoolean, IsOptional } from 'class-validator';

export class SettingParamsValidator {
  @IsBoolean()
  public toCheckAuth: boolean | null;

  @IsOptional()
  @IsBoolean()
  public toFilterMetric: boolean | null;
}
