import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../app/core/services/auth.service';
import { Role } from '../admin/users/interfaces/user.enums';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);

  userName: string = '';
  tenantName: string = '';
  isAdmin: boolean = false;

  private userSubscription?: Subscription;

  ngOnInit() {
    this.userSubscription = this.authService.currentUser$.subscribe(
      (user: any) => {
        if (user) {
          this.userName = user.name;
          this.isAdmin = user.role === Role.ADMIN;
          this.tenantName = user.tenant?.companyName || user.tenantName || '';
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }
}
