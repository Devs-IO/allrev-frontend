import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { Role } from '../admin/users/interfaces/user.enums';

// Core Imports

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);

  // Signals para a View
  userName = signal<string>('Visitante');
  userEmail = signal<string>('');
  userRole = signal<string>('');

  // Computed helpers (opcional, se quiser lógica derivada)
  isAdmin = signal<boolean>(false);

  ngOnInit() {
    // Reatividade instantânea baseada no estado local (sem delay de HTTP)
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.userName.set(user.name);
        this.userEmail.set(user.email);
        this.userRole.set(this.translateRole(user.role));
        this.isAdmin.set(user.role === Role.ADMIN);
      }
    });
  }

  private translateRole(role: string): string {
    switch (role) {
      case Role.ADMIN:
        return 'Administrador';
      case Role.MANAGER_REVIEWERS:
        return 'Gestor';
      case Role.ASSISTANT_REVIEWERS:
        return 'Assistente';
      case Role.CLIENT:
        return 'Cliente';
      default:
        return role;
    }
  }
}
