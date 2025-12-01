import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);

  ngOnInit() {
    // Apenas inicializa os listeners do estado do usuário.
    // O redirecionamento de segurança agora é responsabilidade exclusiva do authGuard.
    if (this.authService.isAuthenticated()) {
      this.authService.loadUserProfile().subscribe();
      this.authService.currentUser$.subscribe();
    }
  }

  ngAfterViewInit(): void {
    // Inicialização global de tooltips/dropdowns do Bootstrap se necessário
    document.querySelectorAll('.dropdown-toggle').forEach((dropdown) => {
      new bootstrap.Dropdown(dropdown);
    });
  }
}
