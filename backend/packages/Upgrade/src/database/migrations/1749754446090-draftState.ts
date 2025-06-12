import { MigrationInterface, QueryRunner } from 'typeorm';

export class DraftState1749754446090 implements MigrationInterface {
  name = 'DraftState1749754446090';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."state_time_log_fromstate_enum" RENAME TO "state_time_log_fromstate_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."state_time_log_fromstate_enum" AS ENUM('draft', 'inactive', 'preview', 'scheduled', 'enrolling', 'enrollmentComplete', 'cancelled', 'archived')`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."state_time_log" ALTER COLUMN "fromState" TYPE "public"."state_time_log_fromstate_enum" USING "fromState"::"text"::"public"."state_time_log_fromstate_enum"`
    );
    await queryRunner.query(`DROP TYPE "public"."state_time_log_fromstate_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."state_time_log_tostate_enum" RENAME TO "state_time_log_tostate_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."state_time_log_tostate_enum" AS ENUM('draft', 'inactive', 'preview', 'scheduled', 'enrolling', 'enrollmentComplete', 'cancelled', 'archived')`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."state_time_log" ALTER COLUMN "toState" TYPE "public"."state_time_log_tostate_enum" USING "toState"::"text"::"public"."state_time_log_tostate_enum"`
    );
    await queryRunner.query(`DROP TYPE "public"."state_time_log_tostate_enum_old"`);
    await queryRunner.query(`ALTER TYPE "public"."experiment_state_enum" RENAME TO "experiment_state_enum_old"`);
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_state_enum" AS ENUM('draft', 'inactive', 'preview', 'scheduled', 'enrolling', 'enrollmentComplete', 'cancelled', 'archived')`
    );
    await queryRunner.query(`ALTER TABLE "public"."experiment" ALTER COLUMN "state" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "public"."experiment" ALTER COLUMN "state" TYPE "public"."experiment_state_enum" USING "state"::"text"::"public"."experiment_state_enum"`
    );
    await queryRunner.query(`ALTER TABLE "public"."experiment" ALTER COLUMN "state" SET DEFAULT 'inactive'`);

    await queryRunner.query(`DROP TYPE "public"."experiment_state_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_state_enum_old" AS ENUM('cancelled', 'enrolling', 'enrollmentComplete', 'inactive', 'preview', 'scheduled', 'archived')`
    );
    await queryRunner.query(`ALTER TABLE "public"."experiment" ALTER COLUMN "state" DROP DEFAULT`);

    await queryRunner.query(
      `ALTER TABLE "public"."experiment" ALTER COLUMN "state" TYPE "public"."experiment_state_enum_old" USING "state"::"text"::"public"."experiment_state_enum_old"`
    );
    await queryRunner.query(`ALTER TABLE "public"."experiment" ALTER COLUMN "state" SET DEFAULT 'inactive'`);
    await queryRunner.query(`DROP TYPE "public"."experiment_state_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."experiment_state_enum_old" RENAME TO "experiment_state_enum"`);
    await queryRunner.query(
      `CREATE TYPE "public"."state_time_log_tostate_enum_old" AS ENUM('cancelled', 'enrolling', 'enrollmentComplete', 'inactive', 'preview', 'scheduled', 'archived')`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."state_time_log" ALTER COLUMN "toState" TYPE "public"."state_time_log_tostate_enum_old" USING "toState"::"text"::"public"."state_time_log_tostate_enum_old"`
    );
    await queryRunner.query(`DROP TYPE "public"."state_time_log_tostate_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."state_time_log_tostate_enum_old" RENAME TO "state_time_log_tostate_enum"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."state_time_log_fromstate_enum_old" AS ENUM('cancelled', 'enrolling', 'enrollmentComplete', 'inactive', 'preview', 'scheduled','archived')`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."state_time_log" ALTER COLUMN "fromState" TYPE "public"."state_time_log_fromstate_enum_old" USING "fromState"::"text"::"public"."state_time_log_fromstate_enum_old"`
    );
    await queryRunner.query(`DROP TYPE "public"."state_time_log_fromstate_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."state_time_log_fromstate_enum_old" RENAME TO "state_time_log_fromstate_enum"`
    );
  }
}
