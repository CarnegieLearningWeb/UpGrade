import {MigrationInterface, QueryRunner} from "typeorm";

export class revertIndividualExclusionGroupId1715937232092 implements MigrationInterface {
    name = 'revertIndividualExclusionGroupId1715937232092'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "individual_exclusion" DROP COLUMN "groupId"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "individual_exclusion" ADD "groupId" character varying`);
    }

}
