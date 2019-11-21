import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn()
  public id: string;

  @Column({ type: 'json' })
  public group: object;
}
