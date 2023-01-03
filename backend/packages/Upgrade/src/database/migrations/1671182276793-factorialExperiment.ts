import { MigrationInterface, QueryRunner } from 'typeorm';

export class factorialExperiment1671182276793 implements MigrationInterface {
  name = 'factorialExperiment1671182276793';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "level_combination_element" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" uuid NOT NULL, "conditionId" uuid, "levelId" uuid, CONSTRAINT "PK_dc280a2be086193e0bc06cd88fa" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "level" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" uuid NOT NULL, "name" character varying NOT NULL, "description" character varying, "alias" character varying, "order" integer, "factorId" uuid, CONSTRAINT "PK_d3f1a7a6f09f1c3144bacdc6bcc" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "factor" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" uuid NOT NULL, "name" character varying NOT NULL, "order" integer, "decisionPointId" uuid, CONSTRAINT "PK_474c0e9d4ca1c181f178952187d" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`ALTER TABLE "experiment_condition" ALTER COLUMN "conditionCode" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "level_combination_element" ADD CONSTRAINT "FK_6884570d63bde354d65406ceb3f" FOREIGN KEY ("conditionId") REFERENCES "experiment_condition"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "level_combination_element" ADD CONSTRAINT "FK_ecec1a2e76e475ee9f4c14ad94e" FOREIGN KEY ("levelId") REFERENCES "level"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "level" ADD CONSTRAINT "FK_0d95bcd7511d345903a8c6b8481" FOREIGN KEY ("factorId") REFERENCES "factor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "factor" ADD CONSTRAINT "FK_b3ddfa4362e435c06a724585b8f" FOREIGN KEY ("decisionPointId") REFERENCES "decision_point"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "factor" DROP CONSTRAINT "FK_b3ddfa4362e435c06a724585b8f"`);
    await queryRunner.query(`ALTER TABLE "level" DROP CONSTRAINT "FK_0d95bcd7511d345903a8c6b8481"`);
    await queryRunner.query(`ALTER TABLE "level_combination_element" DROP CONSTRAINT "FK_ecec1a2e76e475ee9f4c14ad94e"`);
    await queryRunner.query(`ALTER TABLE "level_combination_element" DROP CONSTRAINT "FK_6884570d63bde354d65406ceb3f"`);
    await queryRunner.query(`ALTER TABLE "experiment_condition" ALTER COLUMN "conditionCode" SET NOT NULL`);
    await queryRunner.query(`DROP TABLE "factor"`);
    await queryRunner.query(`DROP TABLE "level"`);
    await queryRunner.query(`DROP TABLE "level_combination_element"`);
  }
}
