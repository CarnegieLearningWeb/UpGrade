import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { ExperimentUser } from './ExperimentUser';
import { StratificationFactor } from './StratificationFactor';

@Entity()
export class UserStratificationFactor extends BaseModel {
  @PrimaryColumn()
  public userId: string;

  @ManyToOne(() => ExperimentUser, (user) => user.userStratificationFactor)
  @JoinColumn({ name: 'userId' })
  public user: ExperimentUser;

  @PrimaryColumn()
  public factorName: string;

  @ManyToOne(() => StratificationFactor, (stratificationFactor) => stratificationFactor.userStratificationFactor, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'factorName' })
  public stratificationFactor: StratificationFactor;

  @Column()
  public stratificationFactorValue: string;
}
