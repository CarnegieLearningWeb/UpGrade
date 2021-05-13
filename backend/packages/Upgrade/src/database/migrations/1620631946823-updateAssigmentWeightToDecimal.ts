import {MigrationInterface, QueryRunner} from 'typeorm';

export class updateAssigmentWeightToDecimal1620631946823 implements MigrationInterface {
    public name = 'updateAssigmentWeightToDecimal1620631946823';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "experiment_condition" DROP COLUMN "assignmentWeight"`);
        await queryRunner.query(`ALTER TABLE "experiment_condition" ADD "assignmentWeight" real NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "experiment_condition" DROP COLUMN "assignmentWeight"`);
        await queryRunner.query(`ALTER TABLE "experiment_condition" ADD "assignmentWeight" integer NOT NULL`);
    }

}
