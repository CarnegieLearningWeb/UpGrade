import { Entity, Column } from 'typeorm';
import { BaseModel } from './base/BaseModel';

@Entity()
export class ExplicitGroupExclusion extends BaseModel {
  @Column({ primary: true })
  public groupId: string;

  @Column({ primary: true })
  public type: string;
}
