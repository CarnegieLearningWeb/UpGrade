import { ArrayNotEmpty, ArrayUnique, IsArray, IsUUID } from 'class-validator';
import { BatchEntityIdsRequest } from 'upgrade_types';

export class BatchEntityIdsValidator implements BatchEntityIdsRequest {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique((id: unknown) => (typeof id === 'string' ? id.toLowerCase() : id))
  @IsUUID('all', { each: true })
  public ids: string[];
}
