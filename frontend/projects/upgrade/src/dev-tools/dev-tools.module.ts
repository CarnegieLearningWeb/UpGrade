import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeyValueBubbleComponent } from './key-value-bubble/key-value-bubble.component';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [KeyValueBubbleComponent],
  imports: [CommonModule, DragDropModule],
  exports: [KeyValueBubbleComponent, DragDropModule],
})
export class DevToolsModule {}
