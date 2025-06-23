import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropExperimentUserFKFromExposures1750860557069 implements MigrationInterface {
  name = 'DropExperimentUserFKFromExposures1750860557069';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "feature_flag_exposure" DROP CONSTRAINT "FK_6cefc76de0ca7c9a38faae5a8c4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6cefc76de0ca7c9a38faae5a8c"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_6cefc76de0ca7c9a38faae5a8c" ON "feature_flag_exposure" ("experimentUserId") `
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_exposure" ADD CONSTRAINT "FK_6cefc76de0ca7c9a38faae5a8c4" FOREIGN KEY ("experimentUserId") REFERENCES "experiment_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
