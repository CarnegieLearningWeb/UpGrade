import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCard } from '@angular/material/card';

@Component({
  selector: 'app-common-section-card',
  standalone: true,
  imports: [CommonModule, MatCard],
  templateUrl: './common-section-card.component.html',
  styleUrl: './common-section-card.component.scss',
})
export class CommonSectionCardComponent {}
