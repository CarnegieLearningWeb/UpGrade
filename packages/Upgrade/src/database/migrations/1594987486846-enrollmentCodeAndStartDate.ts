import {MigrationInterface, QueryRunner} from "typeorm";

export class enrollmentCodeAndStartDate1594987486846 implements MigrationInterface {
    name = 'enrollmentCodeAndStartDate1594987486846'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "monitored_experiment_point_log" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "versionNumber" integer NOT NULL, "id" SERIAL NOT NULL, "monitoredExperimentPointId" character varying, CONSTRAINT "PK_255b978cf73249198d7c133f8d3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "experiment" ADD "endDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "monitored_experiment_point_log" ADD CONSTRAINT "FK_fb5b3afc5da75bf5377212770ef" FOREIGN KEY ("monitoredExperimentPointId") REFERENCES "monitored_experiment_point"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "monitored_experiment_point_log" DROP CONSTRAINT "FK_fb5b3afc5da75bf5377212770ef"`);
        await queryRunner.query(`ALTER TABLE "experiment" DROP COLUMN "endDate"`);
        await queryRunner.query(`DROP TABLE "monitored_experiment_point_log"`);
    }

}
