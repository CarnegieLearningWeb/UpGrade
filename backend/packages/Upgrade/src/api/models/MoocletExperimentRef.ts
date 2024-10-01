import { Entity, Column, OneToMany, PrimaryColumn } from 'typeorm';
import { MoocletVersionConditionMap } from './MoocletVersionConditionMap';

@Entity()
export class MoocletExperimentRef {
  @PrimaryColumn('uuid')
  public id?: string;

  @Column()
  moocletId?: number;

  @OneToMany(() => MoocletVersionConditionMap, (versionConditionMap) => versionConditionMap.moocletExperimentRef, {
    cascade: true,
  })
  versionConditionMaps: MoocletVersionConditionMap[];

  @Column({ nullable: true })
  policyParametersId?: number;

  @Column({ nullable: true })
  variableId?: number;
}
