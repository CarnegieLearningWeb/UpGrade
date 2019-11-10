import { Entity, PrimaryColumn, Column } from 'typeorm';
import { IsNotEmpty } from 'class-validator';

@Entity()
export class User {
  @PrimaryColumn('uuid')
  public id: string;

  @IsNotEmpty()
  @Column()
  public name: string;

  @Column({ type: 'json' })
  public group: object;
}
