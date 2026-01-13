import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { IMenuButtonItem } from 'upgrade_types';

export interface ActionButton {
  action: string;
  icon?: string;
  disabled?: boolean;
  tooltip?: string;
  tooltipClass?: string;
  translationKey: string;
  colorClass?: string; // CSS class for button color styling
}

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
 *   [slideToggleChecked]="false"
 *   [slideToggleDisabled]="false"
 *   [showPrimaryButton]="true"
 *   [primaryButtonText]="'Add Row'"
 *   [showMenuButton]="true"
 *   [menuButtonItems]="[{ label: 'translation key', action: 'Import', disabled: false }]"
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
  imports: [
    CommonModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    TranslateModule,
  ],
  templateUrl: './common-section-card-action-buttons.component.html',
  styleUrl: './common-section-card-action-buttons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonSectionCardActionButtonsComponent {
  @Input() showSlideToggle?: boolean = false;
  @Input() slideToggleText?: string;
  @Input() slideToggleChecked?: boolean = false;
  @Input() slideToggleDisabled?: boolean = false;
  @Input() slideToggleTooltip?: string = '';
  // New: Support for multiple action buttons
  @Input() actionButtons?: ActionButton[] = [];
  // Legacy: Single primary button (for backward compatibility)
  @Input() showPrimaryButton?: boolean = false;
  @Input() primaryButtonText?: string;
  @Input() primaryButtonIcon?: string;
  @Input() primaryButtonTooltip?: string;
  @Input() showMenuButton?: boolean = false;
  @Input() menuButtonItems?: IMenuButtonItem[] = [];
  @Input() menuButtonDisabled?: boolean = false;
  @Input() menuButtonTooltip?: string;
  @Input() isSectionCardExpanded?: boolean = true;
  @Input() primaryActionBtnDisabled?: boolean = false;
  @Input() sectionCardExpandBtnDisabled?: boolean = false;
  @Input() sectionCardExpandBtnTooltip?: string;
  @Output() slideToggleChange = new EventEmitter<MatSlideToggleChange>();
  @Output() primaryButtonClick = new EventEmitter<void>();
  @Output() actionButtonClick = new EventEmitter<string>(); // Emits action type
  @Output() menuButtonItemClick = new EventEmitter<string>();
  @Output() sectionCardExpandChange = new EventEmitter<boolean>();

  onSlideToggleChange(event: MatSlideToggleChange): void {
    this.slideToggleChange.emit(event);
  }

  onPrimaryButtonClick(): void {
    this.primaryButtonClick.emit();
  }

  onActionButtonClick(action: string): void {
    this.actionButtonClick.emit(action);
  }

  onMenuButtonItemClick(menuButtonItemName: string): void {
    this.menuButtonItemClick.emit(menuButtonItemName);
  }

  onSectionCardExpandChange(): void {
    this.isSectionCardExpanded = !this.isSectionCardExpanded;
    this.sectionCardExpandChange.emit(this.isSectionCardExpanded);
  }
}
