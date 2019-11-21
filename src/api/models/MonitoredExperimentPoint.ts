import { Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class MonitoredExperimentPoint {
  @PrimaryColumn()
  public experimentId: string;

  @PrimaryColumn()
  public experimentPoint: string;

  @PrimaryColumn()
  public userId: string;
}
