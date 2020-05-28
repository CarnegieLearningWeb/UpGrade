import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetricCommonComponent } from './metric-common.component';

describe('MetricCommonComponent', () => {
  let component: MetricCommonComponent;
  let fixture: ComponentFixture<MetricCommonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MetricCommonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetricCommonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
