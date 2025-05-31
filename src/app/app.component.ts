import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-root',
  standalone: true, // Marcando como standalone
  imports: [RouterOutlet], // Importando RouterOutlet
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']); // Redireciona para login se não autenticado
    }
  }

  ngAfterViewInit(): void {
    document.querySelectorAll('.dropdown-toggle').forEach((dropdown) => {
      new bootstrap.Dropdown(dropdown);
    });
  }
}
