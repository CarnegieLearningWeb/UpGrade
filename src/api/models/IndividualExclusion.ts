import { Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class IndividualExclusion {
  @PrimaryColumn()
  public experimentId: string;

  @PrimaryColumn()
  public userId: string;
}
