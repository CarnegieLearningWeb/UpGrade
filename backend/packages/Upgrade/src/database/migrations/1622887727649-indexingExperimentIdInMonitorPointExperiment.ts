import { MigrationInterface, QueryRunner } from 'typeorm';

// tslint:disable-next-line: class-name
export class indexingExperimentIdInMonitorPointExperiment1622887727649 implements MigrationInterface {
  public name = 'indexingExperimentIdInMonitorPointExperiment1622887727649';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_5a5d806842a4176f73c12db4db" ON "monitored_experiment_point" ("experimentId") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_5a5d806842a4176f73c12db4db"`);
  }
}
