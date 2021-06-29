import {MigrationInterface, QueryRunner} from "typeorm";

export class versionChangeTypeORM1624884267999 implements MigrationInterface {
    name = 'versionChangeTypeORM1624884267999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "metric_log" DROP CONSTRAINT "FK_c022cd84fd9fa789cbaee40b41c"`);
        await queryRunner.query(`ALTER TABLE "metric_log" DROP CONSTRAINT "FK_81c6609c523e34b8f001cad7170"`);
        await queryRunner.query(`ALTER TABLE "log" ALTER COLUMN "timeStamp" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "metric_log" ADD CONSTRAINT "FK_81c6609c523e34b8f001cad7170" FOREIGN KEY ("metricKey") REFERENCES "metric"("key") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "metric_log" ADD CONSTRAINT "FK_c022cd84fd9fa789cbaee40b41c" FOREIGN KEY ("logId") REFERENCES "log"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "metric_log" DROP CONSTRAINT "FK_c022cd84fd9fa789cbaee40b41c"`);
        await queryRunner.query(`ALTER TABLE "metric_log" DROP CONSTRAINT "FK_81c6609c523e34b8f001cad7170"`);
        await queryRunner.query(`ALTER TABLE "log" ALTER COLUMN "timeStamp" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "metric_log" ADD CONSTRAINT "FK_81c6609c523e34b8f001cad7170" FOREIGN KEY ("metricKey") REFERENCES "metric"("key") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "metric_log" ADD CONSTRAINT "FK_c022cd84fd9fa789cbaee40b41c" FOREIGN KEY ("logId") REFERENCES "log"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
