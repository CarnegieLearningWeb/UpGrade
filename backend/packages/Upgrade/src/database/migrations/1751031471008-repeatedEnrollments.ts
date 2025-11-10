import { MigrationInterface, QueryRunner } from 'typeorm';

export class RepeatedEnrollments1751031471008 implements MigrationInterface {
  name = 'RepeatedEnrollments1751031471008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "repeated_enrollment" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" SERIAL NOT NULL, "conditionId" uuid, "uniquifier" character varying, "individualEnrollmentId" character varying, CONSTRAINT "PK_c74f7a75a16cda34e12fe4bf23e" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_6e16370d9a50b778e6e35f2256" ON "repeated_enrollment" ("conditionId") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_0672ed69d7d0f18dfe8856fb94" ON "repeated_enrollment" ("individualEnrollmentId") `
    );
    await queryRunner.query(
      `ALTER TABLE "repeated_enrollment" ADD CONSTRAINT "FK_6e16370d9a50b778e6e35f22562" FOREIGN KEY ("conditionId") REFERENCES "experiment_condition"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "repeated_enrollment" ADD CONSTRAINT "FK_0672ed69d7d0f18dfe8856fb945" FOREIGN KEY ("individualEnrollmentId") REFERENCES "individual_enrollment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "repeated_enrollment" DROP CONSTRAINT "FK_0672ed69d7d0f18dfe8856fb945"`);
    await queryRunner.query(`ALTER TABLE "repeated_enrollment" DROP CONSTRAINT "FK_6e16370d9a50b778e6e35f22562"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0672ed69d7d0f18dfe8856fb94"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6e16370d9a50b778e6e35f2256"`);
    await queryRunner.query(`DROP TABLE "repeated_enrollment"`);
  }
}
