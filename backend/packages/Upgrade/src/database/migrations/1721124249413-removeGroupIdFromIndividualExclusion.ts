import { MigrationInterface, QueryRunner } from 'typeorm';

export class removeGroupIdFromIndividualExclusion1721124249413 implements MigrationInterface {
  name = 'removeGroupIdFromIndividualExclusion1721124249413';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "individual_exclusion" DROP COLUMN "groupId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "individual_exclusion" ADD "groupId" character varying`);
  }
}
