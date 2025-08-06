import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../app/core/services/auth.service';
import { RouterModule } from '@angular/router';
import { UserProfile } from '../users/interfaces/user-profile.interface';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  userName = signal<string | null>(null);
  UserEmail = signal<string | null>(null);
  userRole = signal<string | null>(null);

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.getUserProfile().subscribe({
      next: (user: UserProfile) => {
        console.log('User profile loaded:', user);
        this.userName.set(user.name);
        this.UserEmail.set(user.email);
        this.userRole.set(user.role);
      },
      error: (err) => {
        console.error('Erro ao carregar usuário:', err);
      },
    });
  }
}
