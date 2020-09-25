import {MigrationInterface, QueryRunner} from 'typeorm';

// tslint:disable-next-line: class-name
export class updateBaseSchema1601013110916 implements MigrationInterface {
    public name = 'updateBaseSchema1601013110916';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "monitored_experiment_point" ADD "condition" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "monitored_experiment_point" DROP COLUMN "condition"`);
    }

}
