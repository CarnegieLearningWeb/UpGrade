import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertFeatureFlagModalComponent } from './upsert-feature-flag-modal.component';

describe('UpsertFeatureFlagModalComponent', () => {
  let component: UpsertFeatureFlagModalComponent;
  let fixture: ComponentFixture<UpsertFeatureFlagModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpsertFeatureFlagModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UpsertFeatureFlagModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
