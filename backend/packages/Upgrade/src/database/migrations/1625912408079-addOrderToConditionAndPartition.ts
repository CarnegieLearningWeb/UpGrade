import {MigrationInterface, QueryRunner} from 'typeorm';

// tslint:disable-next-line: class-name
export class addOrderToConditionAndPartition1625912408079 implements MigrationInterface {
    public name = 'addOrderToConditionAndPartition1625912408079';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "experiment_condition" ADD "order" integer`);
        await queryRunner.query(`ALTER TABLE "experiment_partition" ADD "order" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "experiment_partition" DROP COLUMN "order"`);
        await queryRunner.query(`ALTER TABLE "experiment_condition" DROP COLUMN "order"`);
    }

}
