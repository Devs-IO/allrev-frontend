import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-portal-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class PortalHomeComponent {
  title = 'Bem-vindo ao Portal do Cliente';

  constructor(private router: Router) {}

  goToOrders(): void {
    this.router.navigate(['/portal/orders']);
  }

  goToChangePassword(): void {
    this.router.navigate(['/change-password']);
  }
}
