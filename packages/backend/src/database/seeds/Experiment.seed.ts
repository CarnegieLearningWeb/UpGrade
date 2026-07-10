import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Experiment } from '../../api/models/Experiment';
import { ExperimentCondition } from '../../api/models/ExperimentCondition';
import { DecisionPoint } from '../../api/models/DecisionPoint';
import { POST_EXPERIMENT_RULE } from 'upgrade_types';

export class CreateExperiments implements Seeder {
  public async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<any> {
    const repository = dataSource.getRepository(Experiment);
    const experimentFactory = factoryManager.get(Experiment);

    const experiments = await experimentFactory.saveMany(10);

    for (const experiment of experiments) {
      const numberOfConditions = Math.floor(2 * Math.random()) + 2;
      const experimentConditionFactory = factoryManager.get(ExperimentCondition);
      const createdConditions: ExperimentCondition[] = await experimentConditionFactory.saveMany(numberOfConditions, {
        experiment: experiment,
      });
      // setting assignmentWeight here
      const generatedNumber = this.generateRandomNumber(createdConditions.length);
      createdConditions.forEach((condition, index) => {
        condition.assignmentWeight = generatedNumber[index];
      });

      // adding revert to in experiment
      if (experiment.postExperimentRule === POST_EXPERIMENT_RULE.ASSIGN && Math.random() < 0.5) {
        experiment.revertTo = createdConditions[Math.floor(createdConditions.length * Math.random())].id;
      }
      const numberOfDecisionPoints = Math.floor(2 * Math.random()) + 2;
      const decisionPointFactory = factoryManager.get(DecisionPoint);
      await decisionPointFactory.saveMany(numberOfDecisionPoints, {
        experiment: experiment,
      });
      await repository.save(experiment);
    }
  }

  private generateRandomNumber(length: number, totalSum = 1): number[] {
    const randomGeneratorArray = [];
    let assignLeft = totalSum;
    new Array(length - 1).fill(null).forEach(() => {
      const generatedNumber = assignLeft * Math.random();
      randomGeneratorArray.push(generatedNumber);
      assignLeft = assignLeft - generatedNumber;
    });
    randomGeneratorArray.push(assignLeft);
    return randomGeneratorArray;
  }
}
