import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeNodeDialogComponent } from './tree-node-dialog.component';

describe('TreeNodeDialogComponent', () => {
  let component: TreeNodeDialogComponent;
  let fixture: ComponentFixture<TreeNodeDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TreeNodeDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeNodeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
