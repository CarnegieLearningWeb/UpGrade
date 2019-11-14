import { Entity, PrimaryColumn, ManyToOne } from 'typeorm';
import { ExperimentCondition } from './ExperimentCondition';

@Entity()
export class IndividualAssignment {
  @PrimaryColumn()
  public experimentId: string;

  @PrimaryColumn()
  public userId: string;

  @ManyToOne(type => ExperimentCondition)
  public condition: ExperimentCondition;
}
