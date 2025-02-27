import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DuplicateSegmentComponent } from './duplicate-segment.component';

xdescribe('DuplicateSegmentComponent', () => {
  let component: DuplicateSegmentComponent;
  let fixture: ComponentFixture<DuplicateSegmentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DuplicateSegmentComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DuplicateSegmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
