import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonRootPageHeaderContainerComponent } from './common-root-page-header-container.component';

xdescribe('CommonRootPageHeaderContainerComponent', () => {
  let component: CommonRootPageHeaderContainerComponent;
  let fixture: ComponentFixture<CommonRootPageHeaderContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonRootPageHeaderContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonRootPageHeaderContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
