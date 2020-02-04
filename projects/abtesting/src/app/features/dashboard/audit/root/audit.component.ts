import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-audit',
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
