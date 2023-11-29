import { CdkDragEnd, CdkDragStart } from '@angular/cdk/drag-drop';
import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { IKeyValueBubbleStyles } from './key-value-bubble.model';
import { KeyValueBubbleService } from './key-value-bubble.service';

@Component({
  selector: 'app-key-value-bubble',
  templateUrl: './key-value-bubble.component.html',
  styleUrls: ['./key-value-bubble.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyValueBubbleComponent implements OnInit {
  @Input() value: any;
  @Input() key: string;
  styles: IKeyValueBubbleStyles;
  position = {
    x: 0,
    y: 0,
  };

  constructor(private jsonViewerService: KeyValueBubbleService) {}

  ngOnInit(): void {
    if (this.value === undefined) {
      this.value = 'value is undefined';
    }
    this.styles = this.jsonViewerService.registerViewerInstance(this.key);
    this.position = {
      y: this.styles.top,
      x: this.styles.left,
    };
  }

  dragEnd($event: CdkDragEnd) {
    console.log($event.source.getFreeDragPosition());
  }

  dragStart($event: CdkDragStart) {
    console.log($event.source.element.nativeElement);
    console.log($event.source.getFreeDragPosition());
  }
}
