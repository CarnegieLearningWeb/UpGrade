import { Factory, Seeder, times } from 'typeorm-seeding';
import { Connection } from 'typeorm/connection/Connection';
import { Experiment } from '../../api/models/Experiment';
import { ExperimentCondition } from '../../api/models/ExperimentCondition';
import { ExperimentPartition } from '../../api/models/ExperimentPartition';
import { POST_EXPERIMENT_RULE } from 'upgrade_types';

export class CreateExperiments implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    const em = connection.createEntityManager();
    await times(10, async n => {
      // create and save experiment here
      const experiment = await factory(Experiment)().make();
      await em.save(experiment);

      const numberOfConditions = Math.floor(2 * Math.random()) + 2;
      const createdConditions: ExperimentCondition[] = await factory(ExperimentCondition)({
        experimentId: experiment.id,
      }).seedMany(numberOfConditions);

      // setting assignmentWeight here
      const generatedNumber = this.generateRandomNumber(createdConditions.length);
      createdConditions.map((condition, index) => {
        condition.assignmentWeight = generatedNumber[index];
      });

      // adding revert to in experiment
      if (experiment.postExperimentRule === POST_EXPERIMENT_RULE.ASSIGN && Math.random() < 0.5) {
        experiment.revertTo = createdConditions[Math.floor(createdConditions.length * Math.random())].id;
      }

      const numberOfPartitions = Math.floor(2 * Math.random()) + 2;
      await factory(ExperimentPartition)({
        experimentId: experiment.id,
      }).seedMany(numberOfPartitions);

      await em.save(experiment);
    });
  }

  private generateRandomNumber(length: number, totalSum: number = 1): number[] {
    const randomGeneratorArray = [];
    let assignLeft = totalSum;
    new Array(length - 1).forEach(() => {
      const generatedNumber = assignLeft * Math.random();
      randomGeneratorArray.push(generatedNumber);
      assignLeft = assignLeft - generatedNumber;
    });
    randomGeneratorArray.push(assignLeft);
    return randomGeneratorArray;
  }
}
