import { Component } from '@angular/core';
import { TenantsService } from '../../../tenants/tenants.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { CreateUserDto } from '../../../../core/dtos/user.dto';

@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class UserCreateComponent {
  formData: Partial<CreateUserDto> = {};
  error: string | null = null;
  tenants: any[] = [];
  isAdmin: boolean = false;

  constructor(
    private usersService: UsersService,
    private router: Router,
    private tenantsService: TenantsService,
    private authService: AuthService
  ) {
    this.loadTenants();
    this.checkAdmin();
  }

  loadTenants() {
    this.tenantsService.getTenants().subscribe({
      next: (tenants: any[]) => (this.tenants = tenants),
      error: () => (this.tenants = []),
    });
  }

  checkAdmin() {
    this.authService.getUser().subscribe({
      next: (user: any) => (this.isAdmin = user.role === 'admin'),
      error: () => (this.isAdmin = false),
    });
  }

  openTenantForm() {
    this.router.navigate(['/tenants/create']);
  }

  submit() {
    this.usersService.createUser(this.formData as CreateUserDto).subscribe({
      next: () => this.router.navigate(['/users']),
      error: (err) => (this.error = 'Erro ao criar usuário'),
    });
  }
}
