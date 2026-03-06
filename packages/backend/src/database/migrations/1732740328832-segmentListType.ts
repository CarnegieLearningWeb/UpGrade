import { MigrationInterface, QueryRunner } from 'typeorm';

export class SegmentListType1732740328832 implements MigrationInterface {
  name = 'SegmentListType1732740328832';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "segment" ADD "listType" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "segment" DROP COLUMN "listType"`);
  }
}
