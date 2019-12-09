import { Entity, PrimaryColumn, Column } from 'typeorm';
import { BaseModel } from './base/BaseModel';

@Entity()
export class User extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @Column({ type: 'json' })
  public group: object;
}
