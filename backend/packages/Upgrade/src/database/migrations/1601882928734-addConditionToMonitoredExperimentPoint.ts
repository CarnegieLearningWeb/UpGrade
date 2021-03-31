import {MigrationInterface, QueryRunner} from 'typeorm';

// tslint:disable-next-line: class-name
export class addConditionToMonitoredExperimentPoint1601882928734 implements MigrationInterface {
    public name = 'addConditionToMonitoredExperimentPoint1601882928734';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "monitored_experiment_point" ADD "condition" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "monitored_experiment_point" DROP COLUMN "condition"`);
    }

}
