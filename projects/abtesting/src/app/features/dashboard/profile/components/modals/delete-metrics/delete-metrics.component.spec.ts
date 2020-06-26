import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteMetricsComponent } from './delete-metrics.component';
import { TestingModule } from '../../../../../../../testing/testing.module';
import { AnalysisService } from '../../../../../../core/analysis/analysis.service';

describe('DeleteMetricsComponent', () => {
  let component: DeleteMetricsComponent;
  let fixture: ComponentFixture<DeleteMetricsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeleteMetricsComponent ],
      imports: [TestingModule],
      providers: [AnalysisService]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteMetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
