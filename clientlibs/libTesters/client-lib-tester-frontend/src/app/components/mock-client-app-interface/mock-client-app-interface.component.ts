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

  constructor(public eventBus: EventBusService) {}

  ngOnInit(): void {
    console.log('model', this.model);
    console.log('groups', this.model.groups);
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
