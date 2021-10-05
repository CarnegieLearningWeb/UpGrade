import { Directive, HostListener, EventEmitter, Output, ElementRef, Input } from '@angular/core';
import { debounce } from '../decorator/debounce.decorator';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[scroll]'
})
export class ScrollDirective {

  constructor(private el: ElementRef) { }
  // Event output the current scroll percentage
  @Output() scrolled = new EventEmitter<number>();
  @Input() scrollPercentage = 80;

  // Holds the current percent value
  percentValue = 0;

  // Event listener for scroll event on the specific ui element
  @HostListener('scroll', ['$event'])
  @debounce()
  onListenerTriggered(event: UIEvent): void {

    // Calculate the scroll percentage
    const percent = Math.round((this.el.nativeElement.scrollTop / (this.el.nativeElement.scrollHeight - this.el.nativeElement.clientHeight)) * 100);
    // // Compare the new with old and only raise the event if values change and percent is greater than scrollPercentage
    if (this.percentValue !== percent && percent > this.scrollPercentage) {
      //   // Update the percent value
      this.percentValue = percent;
      //   // Emit the event
      this.scrolled.emit(percent);
    }
  }
}
