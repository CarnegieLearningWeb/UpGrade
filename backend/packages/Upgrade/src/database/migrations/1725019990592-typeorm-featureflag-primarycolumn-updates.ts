import { MigrationInterface, QueryRunner } from 'typeorm';

export class TypeormFeatureflagPrimarycolumnUpdates1725019990592 implements MigrationInterface {
  name = 'TypeormFeatureflagPrimarycolumnUpdates1725019990592';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" DROP CONSTRAINT "FK_b592d039e8ae2eed7a00c89cab0"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" DROP CONSTRAINT "REL_b592d039e8ae2eed7a00c89cab"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" DROP CONSTRAINT "FK_e0abd5d8d0200b9e4d2fecf139e"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" DROP CONSTRAINT "REL_e0abd5d8d0200b9e4d2fecf139"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" ADD CONSTRAINT "FK_b592d039e8ae2eed7a00c89cab0" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" ADD CONSTRAINT "FK_e0abd5d8d0200b9e4d2fecf139e" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" DROP CONSTRAINT "FK_e0abd5d8d0200b9e4d2fecf139e"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" DROP CONSTRAINT "FK_b592d039e8ae2eed7a00c89cab0"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" ADD CONSTRAINT "REL_e0abd5d8d0200b9e4d2fecf139" UNIQUE ("segmentId")`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" ADD CONSTRAINT "FK_e0abd5d8d0200b9e4d2fecf139e" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" ADD CONSTRAINT "REL_b592d039e8ae2eed7a00c89cab" UNIQUE ("segmentId")`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" ADD CONSTRAINT "FK_b592d039e8ae2eed7a00c89cab0" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
