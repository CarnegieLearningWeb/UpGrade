import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveTwoCharacterId1782416524885 implements MigrationInterface {
  name = 'RemoveTwoCharacterId1782416524885';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "decision_point" DROP COLUMN "twoCharacterId"`);
    await queryRunner.query(`ALTER TABLE "experiment_condition" DROP COLUMN "twoCharacterId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "experiment_condition" ADD "twoCharacterId" character(2) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "decision_point" ADD "twoCharacterId" character(2) NOT NULL`);
  }
}
