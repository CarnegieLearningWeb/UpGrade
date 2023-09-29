import { MigrationInterface, QueryRunner } from 'typeorm';

export class stratificationFactorFeature1695966648161 implements MigrationInterface {
  name = 'stratificationFactorFeature1695966648161';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "stratification_factor" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" uuid NOT NULL, "stratificationFactorName" character varying NOT NULL, CONSTRAINT "PK_0b8b85d842f1ca83b1008b240eb" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "user_stratification_factor" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "stratificationFactorValue" character varying NOT NULL, "userId" character varying NOT NULL, "stratificationFactorId" uuid NOT NULL, CONSTRAINT "PK_23fb3e3418618a53c5d9cbfeb30" PRIMARY KEY ("userId", "stratificationFactorId"))`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_assignmentalgorithm_enum" AS ENUM('random', 'stratified random sampling')`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."experiment" ADD "assignmentAlgorithm" "public"."experiment_assignmentalgorithm_enum" NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "public"."experiment" ADD "stratificationFactorId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "user_stratification_factor" ADD CONSTRAINT "FK_a314482a152dd63f49898feb468" FOREIGN KEY ("userId") REFERENCES "experiment_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "user_stratification_factor" ADD CONSTRAINT "FK_3eeb586965b5d4fe0238fb89194" FOREIGN KEY ("stratificationFactorId") REFERENCES "stratification_factor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."experiment" ADD CONSTRAINT "FK_9ac712ea8ff6ffe88dd02417aa9" FOREIGN KEY ("stratificationFactorId") REFERENCES "stratification_factor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public"."experiment" DROP CONSTRAINT "FK_9ac712ea8ff6ffe88dd02417aa9"`);
    await queryRunner.query(
      `ALTER TABLE "user_stratification_factor" DROP CONSTRAINT "FK_3eeb586965b5d4fe0238fb89194"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_stratification_factor" DROP CONSTRAINT "FK_a314482a152dd63f49898feb468"`
    );
    await queryRunner.query(`ALTER TABLE "public"."experiment" DROP COLUMN "stratificationFactorId"`);
    await queryRunner.query(`ALTER TABLE "public"."experiment" DROP COLUMN "assignmentAlgorithm"`);
    await queryRunner.query(`DROP TYPE "public"."experiment_assignmentalgorithm_enum"`);
    await queryRunner.query(`DROP TABLE "user_stratification_factor"`);
    await queryRunner.query(`DROP TABLE "stratification_factor"`);
  }
}
