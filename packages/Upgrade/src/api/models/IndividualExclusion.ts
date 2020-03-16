import { Entity, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';

@Entity()
export class IndividualExclusion extends BaseModel {
  @PrimaryColumn()
  public experimentId: string;

  @PrimaryColumn()
  public userId: string;
}
