import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AliasesTableComponent } from './aliases-table.component';

describe('AliasesTableComponent', () => {
  let component: AliasesTableComponent;
  let fixture: ComponentFixture<AliasesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AliasesTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AliasesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
