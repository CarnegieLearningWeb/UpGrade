import {MigrationInterface, QueryRunner} from "typeorm";

export class useMoocletProxy1702339279714 implements MigrationInterface {
    name = 'useMoocletProxy1702339279714'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "experiment" ADD "useMoocletsProxy" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "experiment" ADD "moocletDetails" json`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "experiment" DROP COLUMN "moocletDetails"`);
        await queryRunner.query(`ALTER TABLE "experiment" DROP COLUMN "useMoocletsProxy"`);
    }

}
