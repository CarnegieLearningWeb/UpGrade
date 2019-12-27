import { Entity, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';

@Entity()
export class ExplicitGroupExclusion extends BaseModel {
  @PrimaryColumn()
  public groupId: string;

  @PrimaryColumn()
  public type: string;
}
