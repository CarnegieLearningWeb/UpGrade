import { Entity, Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MoocletExperimentRef } from './MoocletExperimentRef';
import { ExperimentCondition } from './ExperimentCondition';

@Entity()
export class MoocletVersionConditionMap {
  @PrimaryGeneratedColumn()
  public id?: number;

  @ManyToOne(() => MoocletExperimentRef, (moocletExperimentRef) => moocletExperimentRef.versionConditionMaps, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'moocletExperimentRefId' })
  moocletExperimentRef?: MoocletExperimentRef;

  @Column()
  moocletExperimentRefId?: string;

  @ManyToOne(() => ExperimentCondition, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'experimentConditionId' })
  experimentCondition?: ExperimentCondition;

  @Column()
  experimentConditionId?: string;

  @Column()
  moocletVersionId?: number;
}
