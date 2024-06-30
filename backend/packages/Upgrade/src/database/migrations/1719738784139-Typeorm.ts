import { MigrationInterface, QueryRunner } from 'typeorm';

export class Typeorm1719738784139 implements MigrationInterface {
  name = 'Typeorm1719738784139';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_exclusion" DROP CONSTRAINT "FK_915022e01487b0245a16cbc55f3"`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_exclusion" DROP CONSTRAINT "FK_7d22a811ae04d2ed1b8af0e9c05"`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_exclusion" DROP CONSTRAINT "REL_915022e01487b0245a16cbc55f"`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_exclusion" DROP CONSTRAINT "REL_7d22a811ae04d2ed1b8af0e9c0"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" DROP CONSTRAINT "FK_e0abd5d8d0200b9e4d2fecf139e"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" DROP CONSTRAINT "FK_e9d3d49c9779b47390961eb1cff"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" DROP CONSTRAINT "REL_e0abd5d8d0200b9e4d2fecf139"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" DROP CONSTRAINT "REL_e9d3d49c9779b47390961eb1cf"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" DROP CONSTRAINT "FK_b592d039e8ae2eed7a00c89cab0"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" DROP CONSTRAINT "FK_d45d8b0089b0965c79b57fe84e7"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" DROP CONSTRAINT "REL_b592d039e8ae2eed7a00c89cab"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" DROP CONSTRAINT "REL_d45d8b0089b0965c79b57fe84e"`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_inclusion" DROP CONSTRAINT "FK_95161b8f3f8284268fd3af07f17"`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_inclusion" DROP CONSTRAINT "FK_f9e3c925808cc88fe34cafa0ec3"`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_inclusion" DROP CONSTRAINT "REL_95161b8f3f8284268fd3af07f1"`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_inclusion" DROP CONSTRAINT "REL_f9e3c925808cc88fe34cafa0ec"`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_exclusion" ADD CONSTRAINT "FK_915022e01487b0245a16cbc55f3" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_exclusion" ADD CONSTRAINT "FK_7d22a811ae04d2ed1b8af0e9c05" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" ADD CONSTRAINT "FK_e0abd5d8d0200b9e4d2fecf139e" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" ADD CONSTRAINT "FK_e9d3d49c9779b47390961eb1cff" FOREIGN KEY ("featureFlagId") REFERENCES "feature_flag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" ADD CONSTRAINT "FK_b592d039e8ae2eed7a00c89cab0" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" ADD CONSTRAINT "FK_d45d8b0089b0965c79b57fe84e7" FOREIGN KEY ("featureFlagId") REFERENCES "feature_flag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_inclusion" ADD CONSTRAINT "FK_95161b8f3f8284268fd3af07f17" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_inclusion" ADD CONSTRAINT "FK_f9e3c925808cc88fe34cafa0ec3" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_inclusion" DROP CONSTRAINT "FK_f9e3c925808cc88fe34cafa0ec3"`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_inclusion" DROP CONSTRAINT "FK_95161b8f3f8284268fd3af07f17"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" DROP CONSTRAINT "FK_d45d8b0089b0965c79b57fe84e7"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" DROP CONSTRAINT "FK_b592d039e8ae2eed7a00c89cab0"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" DROP CONSTRAINT "FK_e9d3d49c9779b47390961eb1cff"`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" DROP CONSTRAINT "FK_e0abd5d8d0200b9e4d2fecf139e"`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_exclusion" DROP CONSTRAINT "FK_7d22a811ae04d2ed1b8af0e9c05"`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_exclusion" DROP CONSTRAINT "FK_915022e01487b0245a16cbc55f3"`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_inclusion" ADD CONSTRAINT "REL_f9e3c925808cc88fe34cafa0ec" UNIQUE ("experimentId")`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_inclusion" ADD CONSTRAINT "REL_95161b8f3f8284268fd3af07f1" UNIQUE ("segmentId")`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_inclusion" ADD CONSTRAINT "FK_f9e3c925808cc88fe34cafa0ec3" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_inclusion" ADD CONSTRAINT "FK_95161b8f3f8284268fd3af07f17" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" ADD CONSTRAINT "REL_d45d8b0089b0965c79b57fe84e" UNIQUE ("featureFlagId")`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" ADD CONSTRAINT "REL_b592d039e8ae2eed7a00c89cab" UNIQUE ("segmentId")`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" ADD CONSTRAINT "FK_d45d8b0089b0965c79b57fe84e7" FOREIGN KEY ("featureFlagId") REFERENCES "feature_flag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_exclusion" ADD CONSTRAINT "FK_b592d039e8ae2eed7a00c89cab0" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" ADD CONSTRAINT "REL_e9d3d49c9779b47390961eb1cf" UNIQUE ("featureFlagId")`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" ADD CONSTRAINT "REL_e0abd5d8d0200b9e4d2fecf139" UNIQUE ("segmentId")`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" ADD CONSTRAINT "FK_e9d3d49c9779b47390961eb1cff" FOREIGN KEY ("featureFlagId") REFERENCES "feature_flag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "feature_flag_segment_inclusion" ADD CONSTRAINT "FK_e0abd5d8d0200b9e4d2fecf139e" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_exclusion" ADD CONSTRAINT "REL_7d22a811ae04d2ed1b8af0e9c0" UNIQUE ("experimentId")`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_exclusion" ADD CONSTRAINT "REL_915022e01487b0245a16cbc55f" UNIQUE ("segmentId")`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_exclusion" ADD CONSTRAINT "FK_7d22a811ae04d2ed1b8af0e9c05" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "experiment_segment_exclusion" ADD CONSTRAINT "FK_915022e01487b0245a16cbc55f3" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
