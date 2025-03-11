import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ImportSegmentComponent } from './import-segment.component';
import { TestingModule } from '../../../../../../../testing/testing.module';
import { SegmentsService } from '../../../../../../core/segments/segments.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

xdescribe('ImportSegmentComponent', () => {
  let component: ImportSegmentComponent;
  let fixture: ComponentFixture<ImportSegmentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ImportSegmentComponent],
      imports: [TestingModule],
      providers: [SegmentsService, { provide: MatDialogRef, useValue: {} }, { provide: MAT_DIALOG_DATA, useValue: [] }],
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
