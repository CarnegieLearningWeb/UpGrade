import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { ExperimentUser } from './ExperimentUser';
import { StratificationFactor } from './StratificationFactor';

@Entity()
export class UserStratificationFactor extends BaseModel {
  @ManyToOne(() => ExperimentUser, (user) => user.userStratificationFactor, { onDelete: 'CASCADE', primary: true })
  public user: ExperimentUser;

  @ManyToOne(() => StratificationFactor, (stratificationFactor) => stratificationFactor.userStratificationFactor, {
    onDelete: 'CASCADE',
    primary: true,
  })
  @JoinColumn({ name: 'factorName' })
  public stratificationFactor: StratificationFactor;

  @Column()
  public stratificationFactorValue: string;
}
