import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-section-card-example',
  standalone: true,
  imports: [],
  templateUrl: './section-card-example.component.html',
  styleUrl: './section-card-example.component.scss',
})
export class SectionCardExampleComponent {
  @Input() public msg = '';
}
