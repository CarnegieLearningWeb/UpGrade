import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NewSegmentComponent } from './new-segment.component';
import { TestingModule } from '../../../../../../../testing/testing.module';
import { SegmentsService } from '../../../../../../core/segments/segments.service';
import { SegmentMembersComponent } from '../../segment-members/segment-members.component';
import { SegmentOverviewComponent } from '../../segment-overview/segment-overview.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

xdescribe('NewSegmentComponent', () => {
  let component: NewSegmentComponent;
  let fixture: ComponentFixture<NewSegmentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NewSegmentComponent, SegmentOverviewComponent, SegmentMembersComponent],
      imports: [TestingModule],
      providers: [SegmentsService, { provide: MatDialogRef, useValue: {} }, { provide: MAT_DIALOG_DATA, useValue: [] }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewSegmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
