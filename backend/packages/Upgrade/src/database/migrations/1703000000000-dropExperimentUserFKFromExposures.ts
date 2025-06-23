import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropExperimentUserFKFromExposures1703000000000 implements MigrationInterface {
  name = 'DropExperimentUserFKFromExposures1703000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the foreign key constraint from experimentUserId to experiment_user table
    await queryRunner.query(`ALTER TABLE "feature_flag_exposure" DROP CONSTRAINT "FK_6cefc76de0ca7c9a38faae5a8c4"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the foreign key constraint (for rollback purposes)
    await queryRunner.query(
      `ALTER TABLE "feature_flag_exposure" ADD CONSTRAINT "FK_6cefc76de0ca7c9a38faae5a8c4" FOREIGN KEY ("experimentUserId") REFERENCES "experiment_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
