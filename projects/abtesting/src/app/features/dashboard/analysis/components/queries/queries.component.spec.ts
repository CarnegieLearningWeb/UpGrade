import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QueriesComponent } from './queries.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { AnalysisService } from '../../../../../core/analysis/analysis.service';

describe('QueriesComponent', () => {
  let component: QueriesComponent;
  let fixture: ComponentFixture<QueriesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QueriesComponent ],
      imports: [TestingModule],
      providers: [AnalysisService]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QueriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
