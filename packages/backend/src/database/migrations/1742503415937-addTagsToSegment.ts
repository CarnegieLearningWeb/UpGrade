import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTagsToSegment1742503415937 implements MigrationInterface {
  name = 'AddTagsToSegment1742503415937';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "segment" ADD "tags" text array`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "segment" DROP COLUMN "tags"`);
  }
}
