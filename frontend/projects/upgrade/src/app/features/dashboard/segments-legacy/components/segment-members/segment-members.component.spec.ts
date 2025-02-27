import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { SegmentMembersComponent } from './segment-members.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { SegmentsService_LEGACY } from '../../../../../core/segments_LEGACY/segments.service._LEGACY';

xdescribe('SegmentMembersComponent', () => {
  let component: SegmentMembersComponent;
  let fixture: ComponentFixture<SegmentMembersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SegmentMembersComponent],
      imports: [TestingModule],
      providers: [SegmentsService_LEGACY],
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
