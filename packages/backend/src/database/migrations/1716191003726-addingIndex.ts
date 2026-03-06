import { MigrationInterface, QueryRunner } from 'typeorm';

export class addingIndex1716191003726 implements MigrationInterface {
  name = 'addingIndex1716191003726';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_4f4d2f2ec491226d4692ed400f" ON "individual_enrollment" ("conditionId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_43238be19de9500c290393b907" ON "individual_exclusion" ("experimentId") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_de26ba8251f4ebf8b9c8ccf623" ON "individual_exclusion" ("userId") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_de26ba8251f4ebf8b9c8ccf623"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_43238be19de9500c290393b907"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4f4d2f2ec491226d4692ed400f"`);
  }
}
