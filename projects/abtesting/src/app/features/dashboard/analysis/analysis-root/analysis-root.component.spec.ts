import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisRootComponent } from './analysis-root.component';

describe('AnalysisRootComponent', () => {
  let component: AnalysisRootComponent;
  let fixture: ComponentFixture<AnalysisRootComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnalysisRootComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalysisRootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
