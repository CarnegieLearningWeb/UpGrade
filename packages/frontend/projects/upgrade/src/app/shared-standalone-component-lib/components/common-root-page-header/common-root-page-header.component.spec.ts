import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonRootPageHeaderComponent } from './common-root-page-header.component';

xdescribe('CommonRootPageHeaderComponent', () => {
  let component: CommonRootPageHeaderComponent;
  let fixture: ComponentFixture<CommonRootPageHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonRootPageHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonRootPageHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
