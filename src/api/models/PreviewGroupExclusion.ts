import { Entity, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';

@Entity()
export class PreviewGroupExclusion extends BaseModel {
  @PrimaryColumn()
  public experimentId: string;

  @PrimaryColumn()
  public groupId: string;
}
