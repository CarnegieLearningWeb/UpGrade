import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QueriesModalComponent } from './queries-modal.component';

describe('QueriesModalComponent', () => {
  let component: QueriesModalComponent;
  let fixture: ComponentFixture<QueriesModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QueriesModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QueriesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
