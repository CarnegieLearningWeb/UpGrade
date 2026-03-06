import { MigrationInterface, QueryRunner } from 'typeorm';

export class featureFlagExposure1711569269846 implements MigrationInterface {
  name = 'featureFlagExposure1711569269846';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "feature_flag_exposure" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "featureFlagId" uuid NOT NULL, "experimentUserId" uuid NOT NULL, CONSTRAINT "PK_99ab312ceb343f3121eeadb2d50" PRIMARY KEY ("featureFlagId", "experimentUserId"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6908f3ead6dd3a6fd4ce38514e" ON "feature_flag_exposure" ("featureFlagId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6cefc76de0ca7c9a38faae5a8c" ON "feature_flag_exposure" ("experimentUserId") `
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_exposure" ADD CONSTRAINT "FK_6908f3ead6dd3a6fd4ce38514e6" FOREIGN KEY ("featureFlagId") REFERENCES "feature_flag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_exposure" ADD CONSTRAINT "FK_6cefc76de0ca7c9a38faae5a8c4" FOREIGN KEY ("experimentUserId") REFERENCES "feature_flag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "feature_flag_exposure" DROP CONSTRAINT "FK_6cefc76de0ca7c9a38faae5a8c4"`);
    await queryRunner.query(`ALTER TABLE "feature_flag_exposure" DROP CONSTRAINT "FK_6908f3ead6dd3a6fd4ce38514e6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6cefc76de0ca7c9a38faae5a8c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6908f3ead6dd3a6fd4ce38514e"`);
    await queryRunner.query(`DROP TABLE "feature_flag_exposure"`);
  }
}
