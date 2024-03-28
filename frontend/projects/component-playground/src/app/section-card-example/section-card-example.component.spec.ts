import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionCardExampleComponent } from './section-card-example.component';

xdescribe('SectionCardExampleComponent', () => {
  let component: SectionCardExampleComponent;
  let fixture: ComponentFixture<SectionCardExampleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionCardExampleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SectionCardExampleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
