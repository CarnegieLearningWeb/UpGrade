import { Entity, PrimaryColumn, Column } from 'typeorm';
import { BaseModel } from './base/BaseModel';

@Entity()
export class ExplicitGroupExclusion extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @Column()
  public groupId: string;

  @Column()
  public type: string;
}
