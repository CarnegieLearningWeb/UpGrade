import { MigrationInterface, QueryRunner } from 'typeorm';

export class addExcludeIfReachedInDP1661416171909 implements MigrationInterface {
  name = 'addExcludeIfReachedInDP1661416171909';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "public"."decision_point" ADD "excludeIfReached" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public"."decision_point" DROP COLUMN "excludeIfReached"`);
  }
}
