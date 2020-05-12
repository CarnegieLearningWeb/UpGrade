import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteFlagComponent } from './delete-flag.component';

describe('DeleteFlagComponent', () => {
  let component: DeleteFlagComponent;
  let fixture: ComponentFixture<DeleteFlagComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeleteFlagComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteFlagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
