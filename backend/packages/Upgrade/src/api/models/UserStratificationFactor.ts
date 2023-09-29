import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { ExperimentUser } from './ExperimentUser';
import { StratificationFactor } from './StratificationFactor';

@Entity()
export class UserStratificationFactor extends BaseModel {
  @ManyToOne(() => ExperimentUser, (user) => user.userStratificationFactor, { primary: true })
  public user: ExperimentUser;

  @ManyToOne(() => StratificationFactor, (stratificationFactor) => stratificationFactor.userStratificationFactor, {
    onDelete: 'CASCADE',
    primary: true,
  })
  public stratificationFactor: StratificationFactor;

  @Column()
  public stratificationFactorValue: string;
}
