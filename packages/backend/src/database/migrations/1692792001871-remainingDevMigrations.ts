import { MigrationInterface, QueryRunner } from 'typeorm';

export class remainingDevMigrations1692792001871 implements MigrationInterface {
  name = 'remainingDevMigrations1692792001871';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."query_repeatedmeasure_enum" RENAME TO "query_repeatedmeasure_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."query_repeatedmeasure_enum" AS ENUM('MEAN', 'EARLIEST', 'MOST RECENT', 'COUNT', 'PERCENTAGE')`
    );
    await queryRunner.query(`ALTER TABLE "public"."query" ALTER COLUMN "repeatedMeasure" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "public"."query" ALTER COLUMN "repeatedMeasure" TYPE "public"."query_repeatedmeasure_enum" USING "repeatedMeasure"::"text"::"public"."query_repeatedmeasure_enum"`
    );
    await queryRunner.query(`ALTER TABLE "public"."query" ALTER COLUMN "repeatedMeasure" SET DEFAULT 'MOST RECENT'`);
    await queryRunner.query(`DROP TYPE "public"."query_repeatedmeasure_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."query_repeatedmeasure_enum_old" AS ENUM('EARLIEST', 'MEAN', 'MOST RECENT')`
    );
    await queryRunner.query(`ALTER TABLE "public"."query" ALTER COLUMN "repeatedMeasure" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "public"."query" ALTER COLUMN "repeatedMeasure" TYPE "public"."query_repeatedmeasure_enum_old" USING "repeatedMeasure"::"text"::"public"."query_repeatedmeasure_enum_old"`
    );
    await queryRunner.query(`ALTER TABLE "public"."query" ALTER COLUMN "repeatedMeasure" SET DEFAULT 'MOST RECENT'`);
    await queryRunner.query(`DROP TYPE "public"."query_repeatedmeasure_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."query_repeatedmeasure_enum_old" RENAME TO "query_repeatedmeasure_enum"`
    );
  }
}
