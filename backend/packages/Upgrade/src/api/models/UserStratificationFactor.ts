import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { ExperimentUser } from './ExperimentUser';
import { StratificationFactor } from './StratificationFactor';

@Entity()
export class UserStratificationFactor extends BaseModel {
  @PrimaryColumn('uuid')
  @ManyToOne(() => ExperimentUser, (user) => user.userStratificationFactor)
  public user: ExperimentUser;

  @PrimaryColumn('uuid')
  @ManyToOne(() => StratificationFactor, (stratificationFactor) => stratificationFactor.userStratificationFactor, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'factorName' })
  public stratificationFactor: StratificationFactor;

  @Column()
  public stratificationFactorValue: string;
}
