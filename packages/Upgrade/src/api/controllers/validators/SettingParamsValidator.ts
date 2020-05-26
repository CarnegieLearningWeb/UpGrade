import { IsBoolean } from 'class-validator';

export class SettingParamsValidator {
  @IsBoolean()
  public toCheckAuth: boolean;
}
