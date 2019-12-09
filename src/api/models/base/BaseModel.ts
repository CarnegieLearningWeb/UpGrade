import { CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

export abstract class BaseModel {
  @CreateDateColumn({ name: 'created_at' }) public createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) public updatedAt: Date;
  @VersionColumn({ name: 'version_number' }) public versionNumber: number;
}
