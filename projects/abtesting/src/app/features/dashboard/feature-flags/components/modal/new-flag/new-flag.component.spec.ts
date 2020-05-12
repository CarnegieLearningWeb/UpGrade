import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewFlagComponent } from './new-flag.component';

describe('NewFlagComponent', () => {
  let component: NewFlagComponent;
  let fixture: ComponentFixture<NewFlagComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewFlagComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewFlagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
