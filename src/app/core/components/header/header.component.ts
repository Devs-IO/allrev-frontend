import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, Renderer2 } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule, HttpClientModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private renderer = inject(Renderer2);
  userName: string = 'Usuário';
  UserRole: string = 'Usuário';

  ngOnInit() {
    this.authService.getUserProfile().subscribe((user) => {
      console.log('User profile loaded:', user);
      this.userName = user.name;
      this.UserRole = user.role;

      // Add CSS class to body when admin is logged in
      if (this.UserRole === 'admin') {
        this.renderer.addClass(document.body, 'admin-logged-in');
      } else {
        this.renderer.removeClass(document.body, 'admin-logged-in');
      }
    });
  }

  logout() {
    this.authService.logout();
    // Remove admin class when logging out
    this.renderer.removeClass(document.body, 'admin-logged-in');
    this.router.navigate(['/login']);
  }
}
