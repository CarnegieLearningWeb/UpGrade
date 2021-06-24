import { MigrationInterface, QueryRunner } from 'typeorm';

// tslint:disable-next-line: class-name
export class indexLogAndMetric1623613279127 implements MigrationInterface {
  public name = 'indexLogAndMetric1623613279127';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_cea2ed3a494729d4b21edbd298" ON "log" ("userId") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_502b25664bcdd4b6721122faf0" ON "explicit_individual_assignment" ("experimentId") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_cc90d531cdcd7cc8c1a09732cf" ON "group_assignment" ("experimentId") `);
    await queryRunner.query(`CREATE INDEX "IDX_15ae48e288f94c0aab841cd807" ON "group_exclusion" ("experimentId") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_9cce80b86e5605438f52847b77" ON "individual_assignment" ("experimentId") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_77666162ac932bae16f6c3a876" ON "individual_assignment" ("userId") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_5b6866e6c1817823cb35c14736" ON "monitored_experiment_point" ("userId") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_5b6866e6c1817823cb35c14736"`);
    await queryRunner.query(`DROP INDEX "IDX_77666162ac932bae16f6c3a876"`);
    await queryRunner.query(`DROP INDEX "IDX_9cce80b86e5605438f52847b77"`);
    await queryRunner.query(`DROP INDEX "IDX_15ae48e288f94c0aab841cd807"`);
    await queryRunner.query(`DROP INDEX "IDX_cc90d531cdcd7cc8c1a09732cf"`);
    await queryRunner.query(`DROP INDEX "IDX_502b25664bcdd4b6721122faf0"`);
    await queryRunner.query(`DROP INDEX "IDX_cea2ed3a494729d4b21edbd298"`);
  }
}
