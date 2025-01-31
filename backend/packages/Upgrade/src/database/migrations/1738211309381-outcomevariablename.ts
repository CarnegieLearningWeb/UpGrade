import { MigrationInterface, QueryRunner } from "typeorm";

export class Outcomevariablename1738211309381 implements MigrationInterface {
    name = 'Outcomevariablename1738211309381'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mooclet_experiment_ref" ADD "outcomeVariableName" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mooclet_experiment_ref" DROP COLUMN "outcomeVariableName"`);
    }

}
