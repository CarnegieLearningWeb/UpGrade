import { MigrationInterface, QueryRunner } from 'typeorm';

export class clientExclusionCode1661429767642 implements MigrationInterface {
  name = 'clientExclusionCode1661429767642';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."group_exclusion_exclusioncode_enum" RENAME TO "group_exclusion_exclusioncode_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."group_exclusion_exclusioncode_enum" AS ENUM('participant excluded due to unspecified error', 'participant reached experiment prior to experiment enrolling', 'participant reached experiment during enrollment complete', 'participant was on the exclusion list', 'participant’s group was on the exclusion list', 'participant excluded due to group assignment logic', 'participant excluded due to incomplete group information', 'participant''s group or working group is incorrect', 'participant is excluded by client')`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."group_exclusion" ALTER COLUMN "exclusionCode" TYPE "public"."group_exclusion_exclusioncode_enum" USING "exclusionCode"::"text"::"public"."group_exclusion_exclusioncode_enum"`
    );
    await queryRunner.query(`DROP TYPE "public"."group_exclusion_exclusioncode_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."individual_exclusion_exclusioncode_enum" RENAME TO "individual_exclusion_exclusioncode_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."individual_exclusion_exclusioncode_enum" AS ENUM('participant excluded due to unspecified error', 'participant reached experiment prior to experiment enrolling', 'participant reached experiment during enrollment complete', 'participant was on the exclusion list', 'participant’s group was on the exclusion list', 'participant excluded due to group assignment logic', 'participant excluded due to incomplete group information', 'participant''s group or working group is incorrect', 'participant is excluded by client')`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."individual_exclusion" ALTER COLUMN "exclusionCode" TYPE "public"."individual_exclusion_exclusioncode_enum" USING "exclusionCode"::"text"::"public"."individual_exclusion_exclusioncode_enum"`
    );
    await queryRunner.query(`DROP TYPE "public"."individual_exclusion_exclusioncode_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."individual_exclusion_exclusioncode_enum_old" AS ENUM('participant excluded due to unspecified error', 'participant reached experiment prior to experiment enrolling', 'participant reached experiment during enrollment complete', 'participant was on the exclusion list', 'participant’s group was on the exclusion list', 'participant excluded due to group assignment logic', 'participant excluded due to incomplete group information', 'participant''s group or working group is incorrect')`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."individual_exclusion" ALTER COLUMN "exclusionCode" TYPE "public"."individual_exclusion_exclusioncode_enum_old" USING "exclusionCode"::"text"::"public"."individual_exclusion_exclusioncode_enum_old"`
    );
    await queryRunner.query(`DROP TYPE "public"."individual_exclusion_exclusioncode_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."individual_exclusion_exclusioncode_enum_old" RENAME TO "individual_exclusion_exclusioncode_enum"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."group_exclusion_exclusioncode_enum_old" AS ENUM('participant excluded due to unspecified error', 'participant reached experiment prior to experiment enrolling', 'participant reached experiment during enrollment complete', 'participant was on the exclusion list', 'participant’s group was on the exclusion list', 'participant excluded due to group assignment logic', 'participant excluded due to incomplete group information', 'participant''s group or working group is incorrect')`
    );
    await queryRunner.query(
      `ALTER TABLE "public"."group_exclusion" ALTER COLUMN "exclusionCode" TYPE "public"."group_exclusion_exclusioncode_enum_old" USING "exclusionCode"::"text"::"public"."group_exclusion_exclusioncode_enum_old"`
    );
    await queryRunner.query(`DROP TYPE "public"."group_exclusion_exclusioncode_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."group_exclusion_exclusioncode_enum_old" RENAME TO "group_exclusion_exclusioncode_enum"`
    );
  }
}
