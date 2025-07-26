import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { CreateUserDto, ResponseUserDto } from '../../types/user.dto';
import { AuthService } from '../../../../app/core/services/auth.service';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class UserEditComponent implements OnInit {
  user: ResponseUserDto | null = null;
  formData: Partial<CreateUserDto> = {};
  loading = true;
  error: string | null = null;
  isAdmin: boolean = false;
  tenantName: string = '';

  constructor(
    private route: ActivatedRoute,
    private usersService: UsersService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.getUser().subscribe({
      next: (user: any) => {
        this.isAdmin = user.role === 'admin';
      },
      error: () => {
        this.isAdmin = false;
      },
    });
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.usersService.getUserById(id).subscribe({
        next: (user) => {
          this.user = user;
          this.formData = { ...user };
          // Try to get company name from user.tenant or fallback to tenantId
          if ((user as any).tenant && (user as any).tenant.companyName) {
            this.tenantName = (user as any).tenant.companyName;
          } else if ((user as any).tenantCompanyName) {
            this.tenantName = (user as any).tenantCompanyName;
          } else {
            this.tenantName = user.tenantId || '';
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Erro ao carregar usuário';
          this.loading = false;
        },
      });
    }
  }

  formatPhone() {
    let phone = this.formData.phone || '';
    phone = phone.replace(/\D/g, '');
    if (phone.length > 0) {
      phone = '(' + phone.substring(0, 2) + ') ' + phone.substring(2);
    }
    if (phone.length > 9) {
      phone = phone.substring(0, 10) + '-' + phone.substring(10, 15);
    }
    this.formData.phone = phone;
  }

  submit() {
    if (this.user) {
      this.usersService
        .updateUser(this.user.id, this.formData as Partial<CreateUserDto>)
        .subscribe({
          next: () => this.router.navigate(['/users']),
          error: (err) => (this.error = 'Erro ao atualizar usuário'),
        });
    }
  }
}
