import { AfterViewInit, Directive, ElementRef, HostListener, Input } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

/**
 * TextOverflowTooltipDirective automatically shows a tooltip with full text
 * when content is truncated with CSS line-clamp or text overflow.
 *
 * Usage:
 * <span
 *   class="truncated-text"
 *   [appTextOverflowTooltip]="fullText"
 *   matTooltipPosition="above"
 * >
 *   {{ fullText }}
 * </span>
 *
 * This directive will:
 * - Detect if text is visually truncated (using scrollHeight vs clientHeight)
 * - Show tooltip only when text overflows
 * - Work with CSS line-clamp, text-overflow, or any overflow method
 * - Update tooltip visibility on hover
 */
@Directive({
  selector: '[appTextOverflowTooltip]',
  standalone: false,
  hostDirectives: [
    {
      directive: MatTooltip,
      inputs: ['matTooltipPosition'],
    },
  ],
})
export class TextOverflowTooltipDirective implements AfterViewInit {
  @Input() appTextOverflowTooltip = '';

  constructor(private elementRef: ElementRef, private tooltip: MatTooltip) {
    // Apply custom tooltip class for styling (max-width, white-space, etc.)
    this.tooltip.tooltipClass = 'text-overflow-tooltip';
  }

  ngAfterViewInit() {
    // Initial check after view is fully rendered
    this.checkOverflow();
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    // Re-check on each hover in case content or layout changed
    this.checkOverflow();
  }

  private checkOverflow() {
    const element = this.elementRef.nativeElement;
    // Check if content height exceeds visible height (truncated)
    const isOverflowing = element.scrollHeight > element.clientHeight;

    if (isOverflowing) {
      // Show tooltip with provided text or fallback to element's text content
      this.tooltip.message = this.appTextOverflowTooltip || element.textContent?.trim() || '';
      this.tooltip.disabled = false;
    } else {
      // Hide tooltip when text is not truncated
      this.tooltip.disabled = true;
    }
  }
}
