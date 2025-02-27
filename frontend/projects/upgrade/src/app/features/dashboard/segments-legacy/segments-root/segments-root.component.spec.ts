import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { SegmentsRootComponent } from './segments-root.component';
import { TestingModule } from '../../../../../testing/testing.module';
import { SegmentsListComponent } from '../components/segments-list/segments-list.component';
import { SegmentsService } from '../../../../core/segments/segments.service';
import { AuthService } from '../../../../core/auth/auth.service';

xdescribe('SegmentsRootComponent', () => {
  let component: SegmentsRootComponent;
  let fixture: ComponentFixture<SegmentsRootComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SegmentsRootComponent, SegmentsListComponent],
      imports: [TestingModule],
      providers: [SegmentsService, AuthService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SegmentsRootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
