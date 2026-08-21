import { IsNotEmpty, IsUUID } from 'class-validator';

export class ListOwnerInputValidator {
  @IsNotEmpty()
  @IsUUID()
  public ownerId: string;
}
