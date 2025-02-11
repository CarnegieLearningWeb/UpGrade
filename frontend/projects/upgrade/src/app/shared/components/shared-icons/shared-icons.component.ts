import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-shared-icons',
  templateUrl: './shared-icons.component.html',
  styleUrls: ['./shared-icons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SharedIconsComponent {
  @Input() iconType: string;
}
