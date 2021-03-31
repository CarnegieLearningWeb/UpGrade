import { Column, Entity, PrimaryColumn, OneToMany } from 'typeorm';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { BaseModel } from './base/BaseModel';
import { Type } from 'class-transformer';
import { FlagVariation } from './FlagVariation';

@Entity()
export class FeatureFlag extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @IsNotEmpty()
  @Column()
  public name: string;

  @Column('text', { unique: true })
  public key: string;

  @Column()
  public description: string;

  @Column()
  public variationType: string;

  @Column()
  public status: boolean;

  @OneToMany(() => FlagVariation, (variation) => variation.featureFlag)
  @ValidateNested()
  @Type(() => FlagVariation)
  public variations: FlagVariation[];
}
