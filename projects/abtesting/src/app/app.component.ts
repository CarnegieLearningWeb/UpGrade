import { Component, OnInit } from '@angular/core';
import { routeAnimations } from './core/core.module';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [routeAnimations]
})
export class AppComponent implements OnInit {
  ngOnInit() {
    this.authService.initializeGapi();
  }

  constructor(private authService: AuthService) {}
}
