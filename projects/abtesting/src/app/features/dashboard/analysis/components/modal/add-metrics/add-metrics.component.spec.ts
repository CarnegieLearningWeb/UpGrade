import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMetricsComponent } from './add-metrics.component';
import { TestingModule } from '../../../../../../../testing/testing.module';

describe('AddMetricsComponent', () => {
  let component: AddMetricsComponent;
  let fixture: ComponentFixture<AddMetricsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddMetricsComponent ],
      imports: [TestingModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
