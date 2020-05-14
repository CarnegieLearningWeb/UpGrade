import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseModel } from './base/BaseModel';

@Entity()
export class Setting extends BaseModel {
  @PrimaryGeneratedColumn()
  public id: string;

  @Column()
  public toCheck: boolean;
}
