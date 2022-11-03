import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SegmentExperimentListComponent } from './segment-experiment-list.component';

xdescribe('SegmentExperimentListComponent', () => {
  let component: SegmentExperimentListComponent;
  let fixture: ComponentFixture<SegmentExperimentListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SegmentExperimentListComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SegmentExperimentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
