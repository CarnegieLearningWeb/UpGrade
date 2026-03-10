import { MigrationInterface, QueryRunner } from 'typeorm';

export class stratificationFactorFeature1696498128121 implements MigrationInterface {
  name = 'stratificationFactorFeature1696498128121';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "stratification_factor" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "stratificationFactorName" character varying NOT NULL, CONSTRAINT "PK_9ebfa233a2cbd8a560ca15f3f54" PRIMARY KEY ("stratificationFactorName"))`
    );
    await queryRunner.query(
      `CREATE TABLE "user_stratification_factor" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "stratificationFactorValue" character varying NOT NULL, "userId" character varying NOT NULL, "factorName" character varying NOT NULL, CONSTRAINT "PK_17c5f1a852052b6800e15febbd6" PRIMARY KEY ("userId", "factorName"))`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."experiment_assignmentalgorithm_enum" AS ENUM('random', 'stratified random sampling')`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."experiment" ADD "assignmentAlgorithm" "public"."experiment_assignmentalgorithm_enum" NOT NULL DEFAULT 'random'`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."experiment" ADD "stratificationFactorStratificationFactorName" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "user_stratification_factor" ADD CONSTRAINT "FK_a314482a152dd63f49898feb468" FOREIGN KEY ("userId") REFERENCES "experiment_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "user_stratification_factor" ADD CONSTRAINT "FK_287fb490668d66047a1f8d96c1e" FOREIGN KEY ("factorName") REFERENCES "stratification_factor"("stratificationFactorName") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."experiment" ADD CONSTRAINT "FK_335189d91114f3a71ff18be6243" FOREIGN KEY ("stratificationFactorStratificationFactorName") REFERENCES "stratification_factor"("stratificationFactorName") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "public"."experiment" DROP CONSTRAINT "FK_335189d91114f3a71ff18be6243"`);
    await queryRunner.query(
      `ALTER TABLE "user_stratification_factor" DROP CONSTRAINT "FK_287fb490668d66047a1f8d96c1e"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_stratification_factor" DROP CONSTRAINT "FK_a314482a152dd63f49898feb468"`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."experiment" DROP COLUMN "stratificationFactorStratificationFactorName"`
    );
    await queryRunner.query(`ALTER TABLE "public"."experiment" DROP COLUMN "assignmentAlgorithm"`);
    await queryRunner.query(`DROP TYPE "public"."experiment_assignmentalgorithm_enum"`);
    await queryRunner.query(`DROP TABLE "user_stratification_factor"`);
    await queryRunner.query(`DROP TABLE "stratification_factor"`);
  }
}
