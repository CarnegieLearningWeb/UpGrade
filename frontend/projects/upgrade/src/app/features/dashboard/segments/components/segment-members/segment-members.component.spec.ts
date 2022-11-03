import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { SegmentMembersComponent } from './segment-members.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { SegmentsService } from '../../../../../core/segments/segments.service';

xdescribe('SegmentMembersComponent', () => {
  let component: SegmentMembersComponent;
  let fixture: ComponentFixture<SegmentMembersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SegmentMembersComponent],
      imports: [TestingModule],
      providers: [SegmentsService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SegmentMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
