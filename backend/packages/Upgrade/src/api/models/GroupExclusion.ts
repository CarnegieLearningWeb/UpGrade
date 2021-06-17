import { PrimaryColumn, Entity, ManyToOne, Column, Index } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { Experiment } from './Experiment';

@Entity()
export class GroupExclusion extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @Index()
  @ManyToOne((type) => Experiment, { onDelete: 'CASCADE' })
  public experiment: Experiment;

  @Column()
  public groupId: string;
}
