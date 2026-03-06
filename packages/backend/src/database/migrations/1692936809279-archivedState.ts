import { MigrationInterface, QueryRunner } from 'typeorm';

export class archivedState1692936809279 implements MigrationInterface {
  name = 'archivedState1692936809279';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "archived_stats" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" uuid NOT NULL, "result" jsonb NOT NULL, "queryId" uuid, CONSTRAINT "REL_df18fe5ea7298a1dc7bfb33b06" UNIQUE ("queryId"), CONSTRAINT "PK_afc8a335c8d9d48cefaf1aa2c09" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TYPE "public"."state_time_log_fromstate_enum" RENAME TO "state_time_log_fromstate_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."state_time_log_fromstate_enum" AS ENUM('inactive', 'preview', 'scheduled', 'enrolling', 'enrollmentComplete', 'cancelled', 'archived')`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."state_time_log" ALTER COLUMN "fromState" TYPE "public"."state_time_log_fromstate_enum" USING "fromState"::"text"::"public"."state_time_log_fromstate_enum"`
    );
    await queryRunner.query(`DROP TYPE "public"."state_time_log_fromstate_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."state_time_log_tostate_enum" RENAME TO "state_time_log_tostate_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."state_time_log_tostate_enum" AS ENUM('inactive', 'preview', 'scheduled', 'enrolling', 'enrollmentComplete', 'cancelled', 'archived')`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."state_time_log" ALTER COLUMN "toState" TYPE "public"."state_time_log_tostate_enum" USING "toState"::"text"::"public"."state_time_log_tostate_enum"`
    );
    await queryRunner.query(`DROP TYPE "public"."state_time_log_tostate_enum_old"`);
    await queryRunner.query(`ALTER TYPE "public"."experiment_state_enum" RENAME TO "experiment_state_enum_old"`);
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_state_enum" AS ENUM('inactive', 'preview', 'scheduled', 'enrolling', 'enrollmentComplete', 'cancelled', 'archived')`
    );
    await queryRunner.query(`ALTER TABLE "public"."experiment" ALTER COLUMN "state" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "public"."experiment" ALTER COLUMN "state" TYPE "public"."experiment_state_enum" USING "state"::"text"::"public"."experiment_state_enum"`
    );
    await queryRunner.query(`ALTER TABLE "public"."experiment" ALTER COLUMN "state" SET DEFAULT 'inactive'`);
    await queryRunner.query(`DROP TYPE "public"."experiment_state_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "archived_stats" ADD CONSTRAINT "FK_df18fe5ea7298a1dc7bfb33b06f" FOREIGN KEY ("queryId") REFERENCES "query"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "archived_stats" DROP CONSTRAINT "FK_df18fe5ea7298a1dc7bfb33b06f"`);
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_state_enum_old" AS ENUM('cancelled', 'enrolling', 'enrollmentComplete', 'inactive', 'preview', 'scheduled')`
    );
    await queryRunner.query(`ALTER TABLE "public"."experiment" ALTER COLUMN "state" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "public"."experiment" ALTER COLUMN "state" TYPE "public"."experiment_state_enum_old" USING "state"::"text"::"public"."experiment_state_enum_old"`
    );
    await queryRunner.query(`ALTER TABLE "public"."experiment" ALTER COLUMN "state" SET DEFAULT 'inactive'`);
    await queryRunner.query(`DROP TYPE "public"."experiment_state_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."experiment_state_enum_old" RENAME TO "experiment_state_enum"`);
    await queryRunner.query(
      `CREATE TYPE "public"."state_time_log_tostate_enum_old" AS ENUM('cancelled', 'enrolling', 'enrollmentComplete', 'inactive', 'preview', 'scheduled')`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."state_time_log" ALTER COLUMN "toState" TYPE "public"."state_time_log_tostate_enum_old" USING "toState"::"text"::"public"."state_time_log_tostate_enum_old"`
    );
    await queryRunner.query(`DROP TYPE "public"."state_time_log_tostate_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."state_time_log_tostate_enum_old" RENAME TO "state_time_log_tostate_enum"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."state_time_log_fromstate_enum_old" AS ENUM('cancelled', 'enrolling', 'enrollmentComplete', 'inactive', 'preview', 'scheduled')`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."state_time_log" ALTER COLUMN "fromState" TYPE "public"."state_time_log_fromstate_enum_old" USING "fromState"::"text"::"public"."state_time_log_fromstate_enum_old"`
    );
    await queryRunner.query(`DROP TYPE "public"."state_time_log_fromstate_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."state_time_log_fromstate_enum_old" RENAME TO "state_time_log_fromstate_enum"`
    );
    await queryRunner.query(`DROP TABLE "archived_stats"`);
  }
}
