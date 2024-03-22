import {MigrationInterface, QueryRunner} from "typeorm";

export class addGroupIdForIndividualExclusion1710484793070 implements MigrationInterface {
    name = 'addGroupIdForIndividualExclusion1710484793070'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "individual_exclusion" ADD "groupId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "individual_exclusion" DROP COLUMN "groupId"`);
    }

}
