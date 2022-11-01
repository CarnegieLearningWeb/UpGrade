import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SegmentOverviewComponent } from './segment-overview.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { SegmentsService } from '../../../../../core/segments/segments.service';

xdescribe('SegmentOverviewComponent', () => {
  let component: SegmentOverviewComponent;
  let fixture: ComponentFixture<SegmentOverviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SegmentOverviewComponent],
      imports: [TestingModule],
      providers: [SegmentsService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SegmentOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
