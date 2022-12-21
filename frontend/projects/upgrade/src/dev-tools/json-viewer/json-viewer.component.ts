import { CdkDragEnd } from '@angular/cdk/drag-drop/drag-events';
import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { IJsonViewerStyles } from './json-viewer.model';
import { JsonViewerService } from './json-viewer.service';

@Component({
  selector: 'app-json-viewer',
  templateUrl: './json-viewer.component.html',
  styleUrls: ['./json-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonViewerComponent implements OnInit {
  @Input() valueToDisplay: Record<string, unknown> | string;
  @Input() name: string;
  viewerStyles: IJsonViewerStyles;
  position = {
    x: 0,
    y: 0,
  };

  constructor(private jsonViewerService: JsonViewerService) {}

  ngOnInit(): void {
    if (this.valueToDisplay === undefined) {
      this.valueToDisplay = 'value is undefined';
    }
    this.viewerStyles = this.jsonViewerService.registerViewerInstance(this.name);
    this.position = {
      y: this.viewerStyles.top,
      x: this.viewerStyles.left,
    };
  }

  dragEnd($event: CdkDragEnd) {
    const element = $event.source.getRootElement();
    const newPos = element.getBoundingClientRect();

    console.log(newPos);

    this.position.x = newPos.x;
    this.position.y = newPos.y;

    this.jsonViewerService.setToCache(this.name, {
      ...this.viewerStyles,
      top: this.position.y,
      left: this.position.x,
    });
  }
}
