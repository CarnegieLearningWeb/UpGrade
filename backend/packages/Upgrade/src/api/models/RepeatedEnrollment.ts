import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { IndividualEnrollment } from '../models/IndividualEnrollment';
import { ExperimentCondition } from '../models/ExperimentCondition';

@Entity()
export class RepeatedEnrollment extends BaseModel {
  @PrimaryGeneratedColumn()
  public id: string;

  @Index()
  @ManyToOne(() => ExperimentCondition, { onDelete: 'CASCADE' })
  public condition: ExperimentCondition;

  @Column({ name: 'conditionId', nullable: true })
  public conditionId?: string;

  @Column({
    nullable: true,
  })
  public uniquifier: string | null;

  @Index()
  @ManyToOne(() => IndividualEnrollment, { onDelete: 'CASCADE' })
  public individualEnrollment: IndividualEnrollment;

  @Column({ name: 'individualEnrollmentId', nullable: true })
  public individualEnrollmentId?: string;
}
