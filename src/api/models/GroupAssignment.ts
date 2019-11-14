import { Entity, PrimaryColumn, ManyToOne } from 'typeorm';
import { ExperimentCondition } from './ExperimentCondition';

@Entity()
export class GroupAssignment {
  @PrimaryColumn()
  public experimentId: string;

  @PrimaryColumn()
  public groupId: string;

  @ManyToOne(type => ExperimentCondition)
  public condition: ExperimentCondition;
}
