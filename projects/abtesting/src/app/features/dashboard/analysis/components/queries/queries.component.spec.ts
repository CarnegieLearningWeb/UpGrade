import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QueriesComponent } from './queries.component';

describe('QueriesComponent', () => {
  let component: QueriesComponent;
  let fixture: ComponentFixture<QueriesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QueriesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QueriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
