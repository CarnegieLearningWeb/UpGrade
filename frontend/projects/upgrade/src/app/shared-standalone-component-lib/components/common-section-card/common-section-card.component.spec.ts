import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonSectionCardComponent } from './common-section-card.component';

describe('CommonSectionCardComponent', () => {
  let component: CommonSectionCardComponent;
  let fixture: ComponentFixture<CommonSectionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonSectionCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CommonSectionCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
