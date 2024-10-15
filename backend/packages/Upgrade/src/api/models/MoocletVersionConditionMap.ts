import { Entity, Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MoocletExperimentRef } from './MoocletExperimentRef';
import { ExperimentCondition } from './ExperimentCondition';

@Entity()
export class MoocletVersionConditionMap {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column()
  moocletVersionId: number;

  @Column()
  upgradeConditionId: string;

  @ManyToOne(() => ExperimentCondition)
  @JoinColumn({ name: 'upgradeConditionId' })
  upgradeCondition?: ExperimentCondition;

  @ManyToOne(() => MoocletExperimentRef, (moocletExperimentRef) => moocletExperimentRef.versionConditionMaps)
  @JoinColumn({ name: 'moocletExperimentRefId' })
  moocletExperimentRef?: MoocletExperimentRef;

  @Column()
  moocletExperimentRefId?: string; // Foreign key column
}
