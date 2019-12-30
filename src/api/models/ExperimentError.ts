import { Entity, PrimaryColumn, Column } from 'typeorm';
import { IsNotEmpty } from 'class-validator';

@Entity()
export class ExperimentError {

  @PrimaryColumn()
  public id: string;

  @IsNotEmpty()
  @Column({
    name: 'end_point',
  })
  public endPoint: string;

  @IsNotEmpty()
  @Column({
    name: 'error_code',
  })
  public errorCode: number;

  @IsNotEmpty()
  @Column()
  public message: string;

  @IsNotEmpty()
  @Column()
  public name: string;

}
