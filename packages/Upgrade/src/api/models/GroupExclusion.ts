import { PrimaryColumn, Entity } from 'typeorm';
import { BaseModel } from './base/BaseModel';

@Entity()
export class GroupExclusion extends BaseModel {
  @PrimaryColumn()
  public experimentId: string;

  @PrimaryColumn()
  public groupId: string;
}
