import { MigrationInterface, QueryRunner } from 'typeorm';

export class conditionOrder1684996673747 implements MigrationInterface {
  name = 'conditionOrder1684996673747';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_conditionorder_enum" AS ENUM('random', 'random round robin', 'ordered round robin')`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."experiment" ADD "conditionOrder" "public"."experiment_conditionorder_enum"`
    );
    await queryRunner.query(
      `ALTER TYPE "public"."experiment_assignmentunit_enum" RENAME TO "experiment_assignmentunit_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_assignmentunit_enum" AS ENUM('individual', 'group', 'within-subjects')`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."experiment" ALTER COLUMN "assignmentUnit" TYPE "public"."experiment_assignmentunit_enum" USING "assignmentUnit"::"text"::"public"."experiment_assignmentunit_enum"`
    );
    await queryRunner.query(`DROP TYPE "public"."experiment_assignmentunit_enum_old"`);
    await queryRunner.query(`ALTER TABLE "public"."experiment" ALTER COLUMN "consistencyRule" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."experiment_assignmentunit_enum_old" AS ENUM('individual', 'group')`);
    await queryRunner.query(
      `ALTER TABLE "public"."experiment" ALTER COLUMN "assignmentUnit" TYPE "public"."experiment_assignmentunit_enum_old" USING "assignmentUnit"::"text"::"public"."experiment_assignmentunit_enum_old"`
    );
    await queryRunner.query(`DROP TYPE "public"."experiment_assignmentunit_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."experiment_assignmentunit_enum_old" RENAME TO "experiment_assignmentunit_enum"`
    );
    await queryRunner.query(`ALTER TABLE "public"."experiment" DROP COLUMN "conditionOrder"`);
    await queryRunner.query(`DROP TYPE "public"."experiment_conditionorder_enum"`);
    await queryRunner.query(`ALTER TABLE "public"."experiment" ALTER COLUMN "consistencyRule" SET NOT NULL`);
  }
}
