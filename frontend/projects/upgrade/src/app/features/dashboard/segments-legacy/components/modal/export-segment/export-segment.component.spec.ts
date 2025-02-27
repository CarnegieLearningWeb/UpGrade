import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportSegmentComponent } from './export-segment.component';

describe('ExportSegmentComponent', () => {
  let component: ExportSegmentComponent;
  let fixture: ComponentFixture<ExportSegmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExportSegmentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExportSegmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
