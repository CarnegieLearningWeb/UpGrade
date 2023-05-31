import { Component, Input, OnInit } from '@angular/core';
import { MockClientAppInterfaceModel, MockClientAppUser } from 'src/app/app-models';
import { EventBusService } from 'src/app/services/event-bus.service';

@Component({
  selector: 'app-mock-client-app-interface',
  templateUrl: './mock-client-app-interface.component.html',
  styleUrls: ['./mock-client-app-interface.component.scss'],
})
export class MockClientAppInterfaceComponent implements OnInit {
  @Input() public model!: MockClientAppInterfaceModel;

  // TODO: how to load in mock clients dynamically?
  constructor(public eventBus: EventBusService) {}

  ngOnInit(): void {
    // use?
  }

  getUser(): MockClientAppUser {
    return this.eventBus.mockAppUser$.value;
  }

  dispatch(hookName: string, payload: any): void {
    this.eventBus.dispatchHookEvent({
      name: hookName,
      payload,
      user: this.getUser(),
    });
  }
}
