import { IsNumber, IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from 'upgrade_types';

export class UserDetailsValidator {
  @IsString()
  @IsNotEmpty()
  public firstName: string;

  @IsString()
  @IsNotEmpty()
  public lastName: string;

  @IsString()
  @IsNotEmpty()
  public email: string;

  @IsNumber()
  @IsNotEmpty()
  public role: UserRole;
}
