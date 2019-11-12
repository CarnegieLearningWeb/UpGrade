import { Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class GroupExclusion {
  @PrimaryColumn()
  public experimentId: string;

  @PrimaryColumn()
  public groupId: string;
}
