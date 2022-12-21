import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JsonViewerComponent } from './json-viewer/json-viewer.component';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [JsonViewerComponent],
  imports: [CommonModule, DragDropModule],
  exports: [JsonViewerComponent, DragDropModule],
})
export class DevToolsModule {}
