import { Entity, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';

@Entity()
export class ExplicitIndividualExclusion extends BaseModel {
  @PrimaryColumn()
  public userId: string;
}
