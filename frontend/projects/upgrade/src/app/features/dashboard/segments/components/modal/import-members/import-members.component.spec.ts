import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ImportMembersComponent as ImportMembersComponent } from './import-members.component';
import { TestingModule } from '../../../../../../../testing/testing.module';
import { SegmentsService } from '../../../../../../core/segments/segments.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

xdescribe('ImportMembersComponent', () => {
  let component: ImportMembersComponent;
  let fixture: ComponentFixture<ImportMembersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImportMembersComponent ],
      imports: [TestingModule],
      providers: [
        SegmentsService,
        { provide: MatDialogRef, useValue: {} },
	      { provide: MAT_DIALOG_DATA, useValue: [] },
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
