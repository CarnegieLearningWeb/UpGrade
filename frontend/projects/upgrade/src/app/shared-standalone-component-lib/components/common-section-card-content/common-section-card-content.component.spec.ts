import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonSectionCardContentComponent } from './common-section-card-content.component';

describe('CommonSectionCardContentComponent', () => {
  let component: CommonSectionCardContentComponent;
  let fixture: ComponentFixture<CommonSectionCardContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonSectionCardContentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonSectionCardContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
