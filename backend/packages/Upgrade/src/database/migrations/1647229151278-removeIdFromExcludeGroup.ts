import { MigrationInterface, QueryRunner } from "typeorm";

// tslint:disable-next-line: class-name
export class removeIdFromExcludeGroup1647229151278 implements MigrationInterface {
    public name = 'removeIdFromExcludeGroup1647229151278'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."explicit_group_exclusion" DROP CONSTRAINT "PK_a256b76485b96308e18f5cb7c51"`);
        await queryRunner.query(`ALTER TABLE "public"."explicit_group_exclusion" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "public"."explicit_group_exclusion" ADD CONSTRAINT "PK_0e9ba5b842407539087cd58ab12" PRIMARY KEY ("groupId", "type")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."explicit_group_exclusion" DROP CONSTRAINT "PK_0e9ba5b842407539087cd58ab12"`);
        await queryRunner.query(`ALTER TABLE "public"."explicit_group_exclusion" ADD "id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "public"."explicit_group_exclusion" ADD CONSTRAINT "PK_a256b76485b96308e18f5cb7c51" PRIMARY KEY ("id")`);
    }

}
