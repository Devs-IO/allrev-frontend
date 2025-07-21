import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { CreateUserDto, ResponseUserDto } from '../../../../core/dtos/user.dto';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class UserEditComponent implements OnInit {
  user: ResponseUserDto | null = null;
  formData: Partial<CreateUserDto> = {};
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private usersService: UsersService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.usersService.getUserById(id).subscribe({
        next: (user) => {
          this.user = user;
          this.formData = { ...user };
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Erro ao carregar usuário';
          this.loading = false;
        }
      });
    }
  }

  submit() {
    if (this.user) {
      this.usersService.updateUser(this.user.id, this.formData as Partial<CreateUserDto>).subscribe({
        next: () => this.router.navigate(['/users']),
        error: (err) => this.error = 'Erro ao atualizar usuário'
      });
    }
  }
}
