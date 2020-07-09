import { MigrationInterface, QueryRunner } from 'typeorm';

// tslint:disable-next-line:class-name
export class queryRepeatedMeasure1593693898617 implements MigrationInterface {
  public name = 'queryRepeatedMeasure1593693898617';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "query_repeatedmeasure_enum" AS ENUM('MEAN', 'EARLIEST', 'MOST_RECENT')`);
    await queryRunner.query(
      `ALTER TABLE "query" ADD "repeatedMeasure" "query_repeatedmeasure_enum" NOT NULL DEFAULT 'MOST_RECENT'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "query" DROP COLUMN "repeatedMeasure"`);
    await queryRunner.query(`DROP TYPE "query_repeatedmeasure_enum"`);
  }
}
