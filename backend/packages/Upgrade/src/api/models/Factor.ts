import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { BaseModel } from './base/BaseModel';
import { DecisionPoint } from './DecisionPoint';
import { Level } from './Level';

@Entity()
export class Factor extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  public name: string;

  @Column({ nullable: true })
  @IsNumber()
  public order: number;

  @ManyToOne(() => DecisionPoint, (decisionPoint) => decisionPoint.factors, { onDelete: 'CASCADE' })
  public decisionPoint: DecisionPoint;

  @OneToMany(() => Level, (level) => level.factor)
  public levels: Level[];
}
