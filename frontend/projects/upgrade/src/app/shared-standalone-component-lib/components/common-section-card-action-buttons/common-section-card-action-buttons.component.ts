import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule } from '@ngx-translate/core';
import { IMenuButtonItem } from 'upgrade_types';

/**
 * The `app-common-section-card-action-buttons` component provides action buttons for the section card header.
 * It contains a slide toggle, a primary button, a menu button, and an expand/collapse button.
 * The component emits events when buttons are clicked or toggled.
 *
 * Example usage:
 *
 * ```
 * <app-common-section-card-action-buttons
 *   [showSlideToggle]="false"
 *   [isEnableToggleChecked]="false"
 *   [showPrimaryButton]="true"
 *   [primaryButtonText]="'Add Row'"
 *   [showMenuButton]="true"
 *   [menuButtonItems]="[{ name: 'Import', disabled: false }, { name: 'Export', disabled: true }]"
 *   [isSectionCardExpanded]="true"
 *   (slideToggleChange)="onSlideToggleChange($event)"
 *   (primaryButtonClick)="onPrimaryButtonClick()"
 *   (menuButtonItemClick)="onMenuButtonItemClick($event)"
 *   (sectionCardExpandChange)="onSectionCardExpandChange($event)"
 * ></app-common-section-card-action-buttons>
 * ```
 */
@Component({
  selector: 'app-common-section-card-action-buttons',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule, MatButtonModule, MatIconModule, MatMenuModule, TranslateModule],
  templateUrl: './common-section-card-action-buttons.component.html',
  styleUrl: './common-section-card-action-buttons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonSectionCardActionButtonsComponent {
  @Input() showSlideToggle?: boolean = false;
  @Input() isEnableToggleChecked?: boolean = false;
  @Input() showPrimaryButton?: boolean = false;
  @Input() primaryButtonText?: string;
  @Input() showMenuButton?: boolean = false;
  @Input() menuButtonItems?: IMenuButtonItem[] = [];
  @Input() isSectionCardExpanded?: boolean = true;
  @Output() slideToggleChange = new EventEmitter<MatSlideToggleChange>();
  @Output() primaryButtonClick = new EventEmitter<void>();
  @Output() menuButtonItemClick = new EventEmitter<string>();
  @Output() sectionCardExpandChange = new EventEmitter<boolean>();

  onSlideToggleChange(event: MatSlideToggleChange): void {
    this.slideToggleChange.emit(event);
  }

  onPrimaryButtonClick(): void {
    this.primaryButtonClick.emit();
  }

  onMenuButtonItemClick(menuButtonItemName: string): void {
    this.menuButtonItemClick.emit(menuButtonItemName);
  }

  onSectionCardExpandChange(): void {
    this.isSectionCardExpanded = !this.isSectionCardExpanded;
    this.sectionCardExpandChange.emit(this.isSectionCardExpanded);
  }
}
