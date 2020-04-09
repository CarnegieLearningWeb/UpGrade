import { PrimaryColumn, Entity } from 'typeorm';
import { BaseModel } from './base/BaseModel';

@Entity()
export class GroupExclusion extends BaseModel {
  // TODO convert this to foreign key
  @PrimaryColumn()
  public experimentId: string;

  @PrimaryColumn()
  public groupId: string;
}
