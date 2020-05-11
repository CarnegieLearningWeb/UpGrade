import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { BaseModel } from './base/BaseModel';
import { FeatureFlag } from './FeatureFlag';

@Entity()
export class FlagVariation extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @Column()
  @IsNotEmpty()
  public value: string;

  @Column({
    nullable: true,
  })
  public name: string;

  @Column({
    nullable: true,
  })
  public description: string;

  @Column('boolean', {
    nullable: true,
    array: true,
  })
  public defaultVariation: boolean[];

  @ManyToOne(() => FeatureFlag, (flag) => flag.variations, { onDelete: 'CASCADE' })
  public featureFlag: FeatureFlag;
}
