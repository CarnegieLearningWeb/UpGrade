import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetricModalComponent } from './metric-modal.component';

describe('MetricModalComponent', () => {
  let component: MetricModalComponent;
  let fixture: ComponentFixture<MetricModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MetricModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetricModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
