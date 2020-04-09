import { Entity, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';

@Entity()
export class IndividualExclusion extends BaseModel {
  // TODO convert this to foreign key
  @PrimaryColumn()
  public experimentId: string;

  @PrimaryColumn()
  public userId: string;
}
