import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateFeatureFlagDialogFormComponent } from './create-feature-flag-dialog-form.component';

describe('CreateFeatureFlagDialogFormComponent', () => {
  let component: CreateFeatureFlagDialogFormComponent;
  let fixture: ComponentFixture<CreateFeatureFlagDialogFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateFeatureFlagDialogFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateFeatureFlagDialogFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
