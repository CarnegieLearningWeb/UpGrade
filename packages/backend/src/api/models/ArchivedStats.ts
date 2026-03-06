import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { BaseModel } from './base/BaseModel';
import { Query } from './Query';

@Entity()
export class ArchivedStats extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @IsNotEmpty()
  @Column('jsonb')
  public result: object;

  @OneToOne(() => Query, (query) => query.archivedStats, { onDelete: 'CASCADE' })
  @JoinColumn()
  public query: Query;
}
