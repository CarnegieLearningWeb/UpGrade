import { Component, Input, OnInit } from '@angular/core';
import { MockClientAppInterfaceModel } from 'src/app/client-library-data';

@Component({
  selector: 'app-mock-client-app-interface',
  templateUrl: './mock-client-app-interface.component.html',
  styleUrls: ['./mock-client-app-interface.component.scss'],
})
export class MockClientAppInterfaceComponent implements OnInit {
  @Input() public model!: MockClientAppInterfaceModel;

  constructor() {}

  ngOnInit(): void {}

  dispatch(hookName: string): void {
    console.log('dispatching:', hookName);
  }
}
