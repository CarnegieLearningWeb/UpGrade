import { IsNumber, IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from 'upgrade_types';

export class UserRoleValidator {
  @IsString()
  @IsNotEmpty()
  public email: string;

  @IsNumber()
  @IsNotEmpty()
  public role: UserRole;
}
