import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileRootComponent } from './profile-root.component';

describe('ProfileRootComponent', () => {
  let component: ProfileRootComponent;
  let fixture: ComponentFixture<ProfileRootComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProfileRootComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileRootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
