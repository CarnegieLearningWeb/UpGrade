import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FlagVariationsComponent } from './flag-variations.component';

describe('FlagVariationsComponent', () => {
  let component: FlagVariationsComponent;
  let fixture: ComponentFixture<FlagVariationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FlagVariationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FlagVariationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
