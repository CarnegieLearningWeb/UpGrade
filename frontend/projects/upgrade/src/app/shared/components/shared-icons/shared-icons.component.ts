import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Location } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-shared-icons',
  templateUrl: './shared-icons.component.html',
  styleUrls: ['./shared-icons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedIconsComponent {
  @Input() iconType: string;

  constructor(private location: Location) {}

  svgFill(id: string): string {
    return `url(${environment.baseHrefPrefix}${this.location.path()}#${id}`;
  }
}
