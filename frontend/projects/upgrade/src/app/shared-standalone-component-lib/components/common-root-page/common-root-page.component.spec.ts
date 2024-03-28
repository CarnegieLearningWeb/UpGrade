import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonRootPageComponent } from './common-root-page.component';
import { ActivatedRoute } from '@angular/router';

xdescribe('CommonRootPageComponent', () => {
  let component: CommonRootPageComponent;
  let fixture: ComponentFixture<CommonRootPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonRootPageComponent, ActivatedRoute],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonRootPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
