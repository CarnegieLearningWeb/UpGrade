import { TestBed } from '@angular/core/testing';
import { TestingModule } from '../../../testing/testing.module';


import { VersionService } from './version.service';

describe('VersionService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [TestingModule]
  }));

  it('should be created', () => {
    const service: VersionService = TestBed.get(VersionService);
    expect(service).toBeTruthy();
  });
});
