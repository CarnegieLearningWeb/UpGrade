import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MockClientAppInterfaceComponent } from './mock-client-app-interface.component';

describe('MockClientAppInterfaceComponent', () => {
  let component: MockClientAppInterfaceComponent;
  let fixture: ComponentFixture<MockClientAppInterfaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MockClientAppInterfaceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MockClientAppInterfaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
