import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonSectionCardListComponent } from './common-section-card-list.component';

describe('CommonSectionCardListComponent', () => {
  let component: CommonSectionCardListComponent;
  let fixture: ComponentFixture<CommonSectionCardListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonSectionCardListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonSectionCardListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
