import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertExperimentModalComponent } from './upsert-experiment-modal.component';

describe('UpsertExperimentModalComponent', () => {
  let component: UpsertExperimentModalComponent;
  let fixture: ComponentFixture<UpsertExperimentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpsertExperimentModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UpsertExperimentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
