import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-shared-icons',
  templateUrl: './shared-icons.component.html',
  styleUrls: ['./shared-icons.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SharedIconsComponent {
  @Input() iconType: string;
}
