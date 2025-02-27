import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { SegmentsListComponent } from './segments-list.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { SegmentsService_LEGACY } from '../../../../../core/segments_LEGACY/segments.service._LEGACY';
import { AuthService } from '../../../../../core/auth/auth.service';

xdescribe('SegmentsListComponent', () => {
  let component: SegmentsListComponent;
  let fixture: ComponentFixture<SegmentsListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SegmentsListComponent],
      imports: [TestingModule],
      providers: [SegmentsService_LEGACY, AuthService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SegmentsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
