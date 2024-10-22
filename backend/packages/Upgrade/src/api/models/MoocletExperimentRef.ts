import { Entity, Column, OneToMany, PrimaryColumn, JoinColumn, OneToOne } from 'typeorm';
import { MoocletVersionConditionMap } from './MoocletVersionConditionMap';
import { Experiment } from './Experiment';

@Entity()
export class MoocletExperimentRef {
  @PrimaryColumn('uuid')
  public id?: string;

  @OneToOne(() => Experiment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'experimentId' })
  experiment: Experiment;

  @Column({ nullable: true })
  experimentId?: string;

  @Column()
  moocletId?: number;

  @OneToMany(() => MoocletVersionConditionMap, (versionConditionMap) => versionConditionMap.moocletExperimentRef, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  versionConditionMaps: MoocletVersionConditionMap[];

  @Column({ nullable: true })
  policyParametersId?: number;

  @Column({ nullable: true })
  variableId?: number;
}
