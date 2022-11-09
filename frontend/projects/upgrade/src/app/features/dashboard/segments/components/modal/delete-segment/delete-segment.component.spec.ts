import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DeleteSegmentComponent } from './delete-segment.component';
import { TestingModule } from '../../../../../../../testing/testing.module';
import { SegmentsService } from '../../../../../../core/segments/segments.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

xdescribe('DeleteSegmentComponent', () => {
  let component: DeleteSegmentComponent;
  let fixture: ComponentFixture<DeleteSegmentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DeleteSegmentComponent],
      imports: [TestingModule],
      providers: [SegmentsService, { provide: MatDialogRef, useValue: {} }, { provide: MAT_DIALOG_DATA, useValue: [] }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteSegmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
