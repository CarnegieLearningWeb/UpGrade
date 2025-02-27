import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ImportSegmentComponent } from './import-segment.component';
import { TestingModule } from '../../../../../../../testing/testing.module';
import { SegmentsService_LEGACY } from '../../../../../../core/segments_LEGACY/segments.service._LEGACY';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

xdescribe('ImportSegmentComponent', () => {
  let component: ImportSegmentComponent;
  let fixture: ComponentFixture<ImportSegmentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ImportSegmentComponent],
      imports: [TestingModule],
      providers: [SegmentsService_LEGACY, { provide: MatDialogRef, useValue: {} }, { provide: MAT_DIALOG_DATA, useValue: [] }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportSegmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
