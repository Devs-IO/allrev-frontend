import { Component, signal, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../interfaces/user-profile.interface';

@Component({
  selector: 'app-sidebar',
  imports: [RouterModule, CommonModule],
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  @Output() toggle = new EventEmitter<void>(); // Emite evento ao alternar
  collapsed = signal<boolean>(false);
  activeSubmenu = signal<string | null>(null);
  userEmail = signal<string | null>(null);
  currentDate = signal(new Date());

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadUserProfile();

    setInterval(() => {
      this.currentDate.set(new Date());
    }, 1000);
  }

  loadUserProfile() {
    this.authService.getUserProfile().subscribe({
      next: (user: UserProfile) => {
        this.userEmail.set(user.email);
      },
      error: (err) => {
        console.error('Erro ao buscar perfil do usuário:', err);
      }
    });
  }

  toggleSidebar() {
    this.collapsed.set(!this.collapsed());
    this.toggle.emit(); // Dispara evento para atualizar layout
  }

  toggleSubmenu(menu: string) {
    this.activeSubmenu.set(this.activeSubmenu() === menu ? null : menu);
  }

  isCollapsed(): boolean {
    return this.collapsed();
  }

  isOpen(menu: string): boolean {
    return this.activeSubmenu() === menu;
  }
}
