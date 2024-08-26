import { MigrationInterface, QueryRunner } from 'typeorm';

export class fixExposureTable1724451768448 implements MigrationInterface {
  name = 'fixExposureTable1724451768448';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "feature_flag_exposure" DROP CONSTRAINT "FK_6cefc76de0ca7c9a38faae5a8c4"`);
    await queryRunner.query(`ALTER TABLE "feature_flag_exposure" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
    await queryRunner.query(`ALTER TABLE "feature_flag_exposure" DROP CONSTRAINT "PK_99ab312ceb343f3121eeadb2d50"`);
    await queryRunner.query(`ALTER TABLE "feature_flag_exposure" DROP CONSTRAINT "FK_6908f3ead6dd3a6fd4ce38514e6"`);
    await queryRunner.query(`ALTER TABLE "feature_flag_exposure" ALTER COLUMN "featureFlagId" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "feature_flag_exposure" ADD CONSTRAINT "PK_1be3f10ff95855a3db14e9708a8" PRIMARY KEY ("id")`
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_6cefc76de0ca7c9a38faae5a8c"`);
    await queryRunner.query(`ALTER TABLE "feature_flag_exposure" DROP COLUMN "experimentUserId"`);
    await queryRunner.query(`ALTER TABLE "feature_flag_exposure" ADD "experimentUserId" character varying`);
    await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "filterMode" SET DEFAULT 'excludeAll'`);
    await queryRunner.query(
      `CREATE INDEX "IDX_6cefc76de0ca7c9a38faae5a8c" ON "feature_flag_exposure" ("experimentUserId") `
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_exposure" ADD CONSTRAINT "FK_6908f3ead6dd3a6fd4ce38514e6" FOREIGN KEY ("featureFlagId") REFERENCES "feature_flag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_exposure" ADD CONSTRAINT "FK_6cefc76de0ca7c9a38faae5a8c4" FOREIGN KEY ("experimentUserId") REFERENCES "experiment_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "feature_flag_exposure" DROP CONSTRAINT "FK_6cefc76de0ca7c9a38faae5a8c4"`);
    await queryRunner.query(`ALTER TABLE "feature_flag_exposure" DROP CONSTRAINT "FK_6908f3ead6dd3a6fd4ce38514e6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6cefc76de0ca7c9a38faae5a8c"`);
    await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "filterMode" SET DEFAULT 'includeAll'`);
    await queryRunner.query(`ALTER TABLE "feature_flag_exposure" DROP COLUMN "experimentUserId"`);
    await queryRunner.query(`ALTER TABLE "feature_flag_exposure" ADD "experimentUserId" uuid NOT NULL`);
    await queryRunner.query(
      `CREATE INDEX "IDX_6cefc76de0ca7c9a38faae5a8c" ON "feature_flag_exposure" ("experimentUserId") `
    );
    await queryRunner.query(`ALTER TABLE "feature_flag_exposure" DROP CONSTRAINT "PK_1be3f10ff95855a3db14e9708a8"`);
    await queryRunner.query(`ALTER TABLE "feature_flag_exposure" ALTER COLUMN "featureFlagId" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "feature_flag_exposure" ADD CONSTRAINT "FK_6908f3ead6dd3a6fd4ce38514e6" FOREIGN KEY ("featureFlagId") REFERENCES "feature_flag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_exposure" ADD CONSTRAINT "PK_99ab312ceb343f3121eeadb2d50" PRIMARY KEY ("featureFlagId", "experimentUserId")`
    );
    await queryRunner.query(`ALTER TABLE "feature_flag_exposure" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "feature_flag_exposure" ADD CONSTRAINT "FK_6cefc76de0ca7c9a38faae5a8c4" FOREIGN KEY ("experimentUserId") REFERENCES "feature_flag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
