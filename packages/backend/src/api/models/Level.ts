import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { BaseModel } from './base/BaseModel';
import { Factor } from './Factor';
import { LevelCombinationElement } from './LevelCombinationElement';
import { PAYLOAD_TYPE } from 'upgrade_types';

@Entity()
export class Level extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  public name: string;

  @Column({ nullable: true })
  @IsString()
  public description: string;

  @Column({ nullable: true })
  @IsString()
  public payloadValue: string;

  @Column({
    type: 'enum',
    enum: PAYLOAD_TYPE,
    default: PAYLOAD_TYPE.STRING,
  })
  public payloadType: PAYLOAD_TYPE;

  @Column({ nullable: true })
  @IsNumber()
  public order: number;

  @ManyToOne(() => Factor, (factor) => factor.levels, { onDelete: 'CASCADE' })
  public factor: Factor;

  @OneToMany(() => LevelCombinationElement, (levelCombinationElement) => levelCombinationElement.level)
  public levelCombinationElements: LevelCombinationElement[];
}
