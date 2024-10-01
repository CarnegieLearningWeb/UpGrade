import { Entity, Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MoocletExperimentRef } from './MoocletExperimentRef';

@Entity()
export class MoocletVersionConditionMap {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column()
  moocletVersionId: number;

  @Column()
  upgradeConditionId: string;

  @ManyToOne(() => MoocletExperimentRef, (moocletExperimentRef) => moocletExperimentRef.versionConditionMaps)
  @JoinColumn({ name: 'moocletExperimentRefId' })
  moocletExperimentRef?: MoocletExperimentRef;

  @Column()
  moocletExperimentRefId?: string; // Foreign key column
}
