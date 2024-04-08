import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeatureFlagRootTableSectionCardHeaderContainerComponent } from './feature-flag-root-table-section-card-header-container.component';

xdescribe('FeatureFlagRootTableSectionCardHeaderComponent', () => {
  let component: FeatureFlagRootTableSectionCardHeaderContainerComponent;
  let fixture: ComponentFixture<FeatureFlagRootTableSectionCardHeaderContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureFlagRootTableSectionCardHeaderContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureFlagRootTableSectionCardHeaderContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
