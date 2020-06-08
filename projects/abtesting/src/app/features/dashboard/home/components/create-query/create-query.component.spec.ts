import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateQueryComponent } from './create-query.component';

describe('CreateQueryComponent', () => {
  let component: CreateQueryComponent;
  let fixture: ComponentFixture<CreateQueryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateQueryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateQueryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
