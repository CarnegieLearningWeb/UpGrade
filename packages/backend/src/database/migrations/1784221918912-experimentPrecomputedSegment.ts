import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExperimentPrecomputedSegment1784221918912 implements MigrationInterface {
  name = 'ExperimentPrecomputedSegment1784221918912';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "experiment_precomputed_segment" (
        "experimentId"  uuid    NOT NULL,
        "inclusionIds"  text[]  NOT NULL DEFAULT '{}',
        "exclusionIds"  text[]  NOT NULL DEFAULT '{}',
        "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"     TIMESTAMP NOT NULL DEFAULT now(),
        "versionNumber" integer   NOT NULL DEFAULT 1,
        CONSTRAINT "PK_experiment_precomputed_segment" PRIMARY KEY ("experimentId"),
        CONSTRAINT "FK_experiment_precomputed_segment_experiment"
          FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "experiment_precomputed_segment"`);
  }
}
