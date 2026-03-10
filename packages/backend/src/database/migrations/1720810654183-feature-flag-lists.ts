import { MigrationInterface, QueryRunner } from 'typeorm';

export class featureFlagLists1720810654183 implements MigrationInterface {
  name = 'featureFlagLists1720810654183';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "feature_flag_segment_exclusion" ADD "enabled" boolean NOT NULL`);
    await queryRunner.query(`ALTER TABLE "feature_flag_segment_exclusion" ADD "listType" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "feature_flag_segment_inclusion" ADD "enabled" boolean NOT NULL`);
    await queryRunner.query(`ALTER TABLE "feature_flag_segment_inclusion" ADD "listType" character varying NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" DROP CONSTRAINT "FK_d45d8b0089b0965c79b57fe84e7"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" DROP CONSTRAINT "REL_d45d8b0089b0965c79b57fe84e"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" DROP CONSTRAINT "FK_e9d3d49c9779b47390961eb1cff"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" DROP CONSTRAINT "REL_e9d3d49c9779b47390961eb1cf"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" ADD CONSTRAINT "FK_d45d8b0089b0965c79b57fe84e7" FOREIGN KEY ("featureFlagId") REFERENCES "feature_flag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" ADD CONSTRAINT "FK_e9d3d49c9779b47390961eb1cff" FOREIGN KEY ("featureFlagId") REFERENCES "feature_flag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" DROP CONSTRAINT "FK_e9d3d49c9779b47390961eb1cff"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" DROP CONSTRAINT "FK_d45d8b0089b0965c79b57fe84e7"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" ADD CONSTRAINT "REL_e9d3d49c9779b47390961eb1cf" UNIQUE ("featureFlagId")`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" ADD CONSTRAINT "FK_e9d3d49c9779b47390961eb1cff" FOREIGN KEY ("featureFlagId") REFERENCES "feature_flag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" ADD CONSTRAINT "REL_d45d8b0089b0965c79b57fe84e" UNIQUE ("featureFlagId")`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" ADD CONSTRAINT "FK_d45d8b0089b0965c79b57fe84e7" FOREIGN KEY ("featureFlagId") REFERENCES "feature_flag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(`ALTER TABLE "feature_flag_segment_inclusion" DROP COLUMN "listType"`);
    await queryRunner.query(`ALTER TABLE "feature_flag_segment_inclusion" DROP COLUMN "enabled"`);
    await queryRunner.query(`ALTER TABLE "feature_flag_segment_exclusion" DROP COLUMN "listType"`);
    await queryRunner.query(`ALTER TABLE "feature_flag_segment_exclusion" DROP COLUMN "enabled"`);
  }
}
