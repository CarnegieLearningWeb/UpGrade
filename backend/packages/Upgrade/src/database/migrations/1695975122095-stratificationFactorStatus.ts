import {MigrationInterface, QueryRunner} from "typeorm";

export class stratificationFactorStatus1695975122095 implements MigrationInterface {
    name = 'stratificationFactorStatus1695975122095'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."user_stratification_factor" DROP CONSTRAINT "FK_a314482a152dd63f49898feb468"`);
        await queryRunner.query(`ALTER TABLE "public"."experiment" ADD CONSTRAINT "FK_9ac712ea8ff6ffe88dd02417aa9" FOREIGN KEY ("stratificationFactorId") REFERENCES "stratification_factor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public"."user_stratification_factor" ADD CONSTRAINT "FK_a314482a152dd63f49898feb468" FOREIGN KEY ("userId") REFERENCES "experiment_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."user_stratification_factor" DROP CONSTRAINT "FK_a314482a152dd63f49898feb468"`);
        await queryRunner.query(`ALTER TABLE "public"."experiment" ADD CONSTRAINT "FK_9ac712ea8ff6ffe88dd02417aa9" FOREIGN KEY ("stratificationFactorId") REFERENCES "stratification_factor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public"."user_stratification_factor" ADD CONSTRAINT "FK_a314482a152dd63f49898feb468" FOREIGN KEY ("userId") REFERENCES "experiment_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
