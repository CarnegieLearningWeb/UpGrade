import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { SegmentsListComponent } from './segments-list.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { SegmentsService } from '../../../../../core/segments/segments.service';
import { AuthService } from '../../../../../core/auth/auth.service';

xdescribe('SegmentsListComponent', () => {
  let component: SegmentsListComponent;
  let fixture: ComponentFixture<SegmentsListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SegmentsListComponent],
      imports: [TestingModule],
      providers: [SegmentsService, AuthService],
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
