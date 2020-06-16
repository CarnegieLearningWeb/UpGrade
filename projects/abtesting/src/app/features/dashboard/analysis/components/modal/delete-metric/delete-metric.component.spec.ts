import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteMetricComponent } from './delete-metric.component';
import { TestingModule } from '../../../../../../../testing/testing.module';
import { AnalysisService } from '../../../../../../core/analysis/analysis.service';

describe('DeleteMetricComponent', () => {
  let component: DeleteMetricComponent;
  let fixture: ComponentFixture<DeleteMetricComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeleteMetricComponent ],
      imports: [TestingModule],
      providers: [AnalysisService]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteMetricComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
