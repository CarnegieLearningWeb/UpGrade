import { Entity, PrimaryColumn, ManyToOne } from 'typeorm';
import { BaseModel } from './base/BaseModel';
import { ExperimentCondition } from './ExperimentCondition';
import { Level } from './Level';

@Entity()
export class LevelCombinationElement extends BaseModel {
  @PrimaryColumn('uuid')
  public id: string;

  @ManyToOne(() => ExperimentCondition, (condition) => condition.levelCombinationElements, { onDelete: 'CASCADE' })
  public condition: ExperimentCondition;

  @ManyToOne(() => Level, (level) => level.levelCombinationElements, { onDelete: 'CASCADE' })
  public level: Level;
}
