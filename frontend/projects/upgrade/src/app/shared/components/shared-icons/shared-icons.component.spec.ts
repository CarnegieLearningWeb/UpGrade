import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedIconsComponent } from './shared-icons.component';
import { TestingModule } from '../../../../testing/testing.module';

xdescribe('SharedIconsComponent', () => {
  let component: SharedIconsComponent;
  let fixture: ComponentFixture<SharedIconsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [TestingModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SharedIconsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
