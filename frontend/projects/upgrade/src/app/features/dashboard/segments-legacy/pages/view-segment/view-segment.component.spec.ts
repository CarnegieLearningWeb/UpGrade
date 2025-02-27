import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewSegmentComponent } from './view-segment.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { SegmentsService_LEGACY } from '../../../../../core/segments_LEGACY/segments.service._LEGACY';
import { AuthService } from '../../../../../core/auth/auth.service';

xdescribe('ViewSegmentComponent', () => {
  let component: ViewSegmentComponent;
  let fixture: ComponentFixture<ViewSegmentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ViewSegmentComponent],
      imports: [TestingModule],
      providers: [SegmentsService_LEGACY, AuthService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewSegmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
