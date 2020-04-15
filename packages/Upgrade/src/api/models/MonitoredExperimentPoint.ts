import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { ExperimentUser } from './ExperimentUser';

@Entity()
export class MonitoredExperimentPoint extends BaseModel {
  @PrimaryColumn()
  public id: string;

  @Column()
  public experimentId: string;

  @ManyToOne((type) => ExperimentUser, { onDelete: 'CASCADE' })
  public user: ExperimentUser;
}
