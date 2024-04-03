import { Component, ViewEncapsulation } from '@angular/core';
import { MatCard } from '@angular/material/card';

@Component({
  selector: 'app-common-section-card',
  standalone: true,
  imports: [MatCard],
  templateUrl: './common-section-card.component.html',
  styleUrl: './common-section-card.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class CommonSectionCardComponent {}
