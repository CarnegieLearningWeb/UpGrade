import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonSectionCardHeaderComponent } from './common-section-card-header.component';

describe('CommonSectionCardHeaderComponent', () => {
  let component: CommonSectionCardHeaderComponent;
  let fixture: ComponentFixture<CommonSectionCardHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonSectionCardHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonSectionCardHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
