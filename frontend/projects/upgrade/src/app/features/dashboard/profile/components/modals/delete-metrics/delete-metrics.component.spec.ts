import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteMetricsComponent } from './delete-metrics.component';
import { TestingModule } from '../../../../../../../testing/testing.module';
import { AnalysisService } from '../../../../../../core/analysis/analysis.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

xdescribe('DeleteMetricsComponent', () => {
  let component: DeleteMetricsComponent;
  let fixture: ComponentFixture<DeleteMetricsComponent>;

  const modalData = {
    key: ['key1', 'key2'],
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DeleteMetricsComponent],
      imports: [TestingModule],
      providers: [
        AnalysisService,
        { provide: MatDialogRef, useValue: {} },
        {
          provide: MAT_DIALOG_DATA,
          useValue: modalData,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteMetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
