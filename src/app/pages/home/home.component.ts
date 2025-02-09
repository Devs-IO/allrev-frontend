import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../core/interfaces/user-profile.interface';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  userName = signal<string | null>(null);

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.getUserProfile().subscribe({
      next: (user: UserProfile) => {
        this.userName.set(user.name);
      },
      error: (err) => {
        console.error('Erro ao carregar usuário:', err);
      }
    });
  }
}
