import {MigrationInterface, QueryRunner} from "typeorm";

export class algorithmEnums1706752936231 implements MigrationInterface {
    name = 'algorithmEnums1706752936231'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "experiment" DROP COLUMN "useMoocletsProxy"`);
        await queryRunner.query(`ALTER TYPE "public"."experiment_assignmentalgorithm_enum" RENAME TO "experiment_assignmentalgorithm_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."experiment_assignmentalgorithm_enum" AS ENUM('random', 'stratified random sampling', 'uniform_random', 'ts_configurable')`);
        await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" TYPE "public"."experiment_assignmentalgorithm_enum" USING "assignmentAlgorithm"::"text"::"public"."experiment_assignmentalgorithm_enum"`);
        await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" SET DEFAULT 'random'`);
        await queryRunner.query(`DROP TYPE "public"."experiment_assignmentalgorithm_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."experiment_assignmentalgorithm_enum_old" AS ENUM('random', 'stratified random sampling')`);
        await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" TYPE "public"."experiment_assignmentalgorithm_enum_old" USING "assignmentAlgorithm"::"text"::"public"."experiment_assignmentalgorithm_enum_old"`);
        await queryRunner.query(`ALTER TABLE "experiment" ALTER COLUMN "assignmentAlgorithm" SET DEFAULT 'random'`);
        await queryRunner.query(`DROP TYPE "public"."experiment_assignmentalgorithm_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."experiment_assignmentalgorithm_enum_old" RENAME TO "experiment_assignmentalgorithm_enum"`);
        await queryRunner.query(`ALTER TABLE "experiment" ADD "useMoocletsProxy" boolean NOT NULL DEFAULT false`);
    }

}
