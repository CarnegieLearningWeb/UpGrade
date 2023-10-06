import {MigrationInterface, QueryRunner} from "typeorm";

export class stratificationFactorStatus1696577185079 implements MigrationInterface {
    name = 'stratificationFactorStatus1696577185079'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."user_stratification_factor" DROP CONSTRAINT "FK_a314482a152dd63f49898feb468"`);
        await queryRunner.query(`ALTER TABLE "public"."experiment" DROP CONSTRAINT "FK_335189d91114f3a71ff18be6243"`);
        await queryRunner.query(`ALTER TABLE "public"."user_stratification_factor" ADD CONSTRAINT "FK_a314482a152dd63f49898feb468" FOREIGN KEY ("userId") REFERENCES "experiment_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public"."experiment" ADD CONSTRAINT "FK_335189d91114f3a71ff18be6243" FOREIGN KEY ("stratificationFactorStratificationFactorName") REFERENCES "stratification_factor"("stratificationFactorName") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."experiment" DROP CONSTRAINT "FK_335189d91114f3a71ff18be6243"`);
        await queryRunner.query(`ALTER TABLE "public"."user_stratification_factor" DROP CONSTRAINT "FK_a314482a152dd63f49898feb468"`);
        await queryRunner.query(`ALTER TABLE "public"."experiment" ADD CONSTRAINT "FK_335189d91114f3a71ff18be6243" FOREIGN KEY ("stratificationFactorStratificationFactorName") REFERENCES "stratification_factor"("stratificationFactorName") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "public"."user_stratification_factor" ADD CONSTRAINT "FK_a314482a152dd63f49898feb468" FOREIGN KEY ("userId") REFERENCES "experiment_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
