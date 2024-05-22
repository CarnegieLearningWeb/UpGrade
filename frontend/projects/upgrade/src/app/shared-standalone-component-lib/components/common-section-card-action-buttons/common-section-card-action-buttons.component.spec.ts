import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonSectionCardActionButtonsComponent } from './common-section-card-action-buttons.component';

describe('CommonSectionCardActionButtonsComponent', () => {
  let component: CommonSectionCardActionButtonsComponent;
  let fixture: ComponentFixture<CommonSectionCardActionButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonSectionCardActionButtonsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CommonSectionCardActionButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
