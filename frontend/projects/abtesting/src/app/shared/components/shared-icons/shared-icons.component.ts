import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-shared-icons',
  templateUrl: './shared-icons.component.html',
  styleUrls: ['./shared-icons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SharedIconsComponent {
  @Input() iconType: string;

  constructor(private location: Location) {}

  svgFill(id: string): string {
    return `url(${this.location.path()}#${id}`;
  }
}
