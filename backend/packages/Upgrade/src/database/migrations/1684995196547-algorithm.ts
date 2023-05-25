import { MigrationInterface, QueryRunner } from 'typeorm';

export class algorithm1684995196547 implements MigrationInterface {
  name = 'algorithm1684995196547';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_algorithm_enum" AS ENUM('random', 'roundRobinRandom', 'roundRobinOrdered')`
    );
    await queryRunner.query(`ALTER TABLE "public"."experiment" ADD "algorithm" "public"."experiment_algorithm_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."experiment_assignmentunit_enum" RENAME TO "experiment_assignmentunit_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_assignmentunit_enum" AS ENUM('individual', 'group', 'withinSubject')`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."experiment" ALTER COLUMN "assignmentUnit" TYPE "public"."experiment_assignmentunit_enum" USING "assignmentUnit"::"text"::"public"."experiment_assignmentunit_enum"`
    );
    await queryRunner.query(`DROP TYPE "public"."experiment_assignmentunit_enum_old"`);
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
    await queryRunner.query(`ALTER TABLE "public"."experiment" DROP COLUMN "algorithm"`);
    await queryRunner.query(`DROP TYPE "public"."experiment_algorithm_enum"`);
  }
}
