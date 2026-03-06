import { MigrationInterface, QueryRunner } from 'typeorm';

export class factorRestructing1679319498815 implements MigrationInterface {
  name = 'factorRestructing1679319498815';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "factor" DROP CONSTRAINT "FK_b3ddfa4362e435c06a724585b8f"`);
    await queryRunner.query(`ALTER TABLE "factor" DROP COLUMN "decisionPointId"`);
    await queryRunner.query(`ALTER TABLE "factor" ADD "description" character varying`);
    await queryRunner.query(`ALTER TABLE "factor" ADD "experimentId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "factor" ADD CONSTRAINT "FK_2dba7d958204335092fdfb5b337" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "factor" DROP CONSTRAINT "FK_2dba7d958204335092fdfb5b337"`);
    await queryRunner.query(`ALTER TABLE "factor" DROP COLUMN "experimentId"`);
    await queryRunner.query(`ALTER TABLE "factor" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "factor" ADD "decisionPointId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "factor" ADD CONSTRAINT "FK_b3ddfa4362e435c06a724585b8f" FOREIGN KEY ("decisionPointId") REFERENCES "decision_point"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
