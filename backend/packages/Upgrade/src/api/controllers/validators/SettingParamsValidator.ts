import { IsBoolean } from 'class-validator';

export class SettingParamsValidator {
  @IsBoolean()
  public toCheckAuth: boolean | null;

  @IsBoolean()
  public toFilterMetric: boolean | null;
}
