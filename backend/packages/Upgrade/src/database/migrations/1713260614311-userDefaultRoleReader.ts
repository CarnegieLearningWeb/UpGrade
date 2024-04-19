import { MigrationInterface, QueryRunner } from 'typeorm';

export class userDefaultRoleReader1713260614311 implements MigrationInterface {
  name = 'userDefaultRoleReader1713260614311';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'reader'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'creator'`);
  }
}
