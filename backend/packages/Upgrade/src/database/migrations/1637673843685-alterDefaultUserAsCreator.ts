import {MigrationInterface, QueryRunner} from "typeorm";

export class alterDefaultUserAsCreator1637673843685 implements MigrationInterface {
    name = 'alterDefaultUserAsCreator1637673843685'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."user" ALTER COLUMN "role" SET DEFAULT 'creator'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."user" ALTER COLUMN "role" SET DEFAULT 'reader'`);
    }

}
