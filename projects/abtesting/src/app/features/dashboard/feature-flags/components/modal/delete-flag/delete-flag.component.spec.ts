import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteFlagComponent } from './delete-flag.component';
import { TestingModule } from '../../../../../../../testing/testing.module';
import { FeatureFlagsService } from '../../../../../../core/feature-flags/feature-flags.service';

describe('DeleteFlagComponent', () => {
  let component: DeleteFlagComponent;
  let fixture: ComponentFixture<DeleteFlagComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeleteFlagComponent ],
      imports: [TestingModule],
      providers: [FeatureFlagsService]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteFlagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
