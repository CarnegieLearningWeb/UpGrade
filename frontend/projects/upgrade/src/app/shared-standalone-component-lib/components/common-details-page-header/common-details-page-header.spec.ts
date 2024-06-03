import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonDetailsPageHeaderComponent } from './common-details-page-header.component';

xdescribe('CommonDetailsPageHeaderComponent', () => {
  let component: CommonDetailsPageHeaderComponent;
  let fixture: ComponentFixture<CommonDetailsPageHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonDetailsPageHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonDetailsPageHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
