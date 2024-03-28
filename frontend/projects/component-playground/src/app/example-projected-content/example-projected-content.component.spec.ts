import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExampleProjectedContentComponent } from './example-projected-content.component';

describe('ExampleProjectedContentComponent', () => {
  let component: ExampleProjectedContentComponent;
  let fixture: ComponentFixture<ExampleProjectedContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExampleProjectedContentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExampleProjectedContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
