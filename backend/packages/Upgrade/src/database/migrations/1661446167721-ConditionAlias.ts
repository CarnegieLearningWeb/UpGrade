import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConditionAlias1661446167721 implements MigrationInterface {
  name = 'ConditionAlias1661446167721';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "condition_alias" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" uuid NOT NULL, "aliasName" character varying NOT NULL, "parentConditionId" uuid, "decisionPointId" character varying, CONSTRAINT "PK_90c7ef90e830732a715147bebcf" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "condition_alias" ADD CONSTRAINT "FK_c95e8b36cee12dbdaa643de2385" FOREIGN KEY ("parentConditionId") REFERENCES "experiment_condition"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "condition_alias" ADD CONSTRAINT "FK_6620368844e3608be5ef131baf3" FOREIGN KEY ("decisionPointId") REFERENCES "decision_point"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "condition_alias" DROP CONSTRAINT "FK_6620368844e3608be5ef131baf3"`);
    await queryRunner.query(`ALTER TABLE "condition_alias" DROP CONSTRAINT "FK_c95e8b36cee12dbdaa643de2385"`);
    await queryRunner.query(`DROP TABLE "condition_alias"`);
  }
}
