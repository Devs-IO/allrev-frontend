import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FunctionalitiesService } from '../../services/functionalities.service';
import { FunctionalityDto } from '../../interfaces/functionalities.interface';
import { UsersService } from '../../../users/services/users.service';
import { ResponseUserDto } from '../../../users/types/user.dto';
import { Router } from '@angular/router';
import { AuthService } from '../../../../app/core/services/auth.service';

@Component({
  selector: 'app-functionalities-list',
  templateUrl: './functionalities-list.component.html',
  styleUrls: ['./functionalities-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
})
export class FunctionalitiesListComponent implements OnInit {
  functionalities: FunctionalityDto[] = [];
  responsibleUsers: { [id: string]: string } = {};
  loading = true;
  currentUserId: string | null = null;
  currentUserName: string | null = null;

  constructor(
    private functionalitiesService: FunctionalitiesService,
    private usersService: UsersService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Load current user name/id for responsibility highlighting
    this.authService.getUserProfile().subscribe({
      next: (u) => {
        this.currentUserId = u?.id || null;
        this.currentUserName = u?.name || null;
      },
      error: () => {
        this.currentUserId = null;
        this.currentUserName = null;
      },
    });

    this.functionalitiesService.getAll().subscribe({
      next: (data) => {
        this.functionalities = data;
        // Coletar todos os responsibleUserId únicos
        const ids = Array.from(
          new Set(data.map((f) => f.responsibleUserId).filter(Boolean))
        );
        if (ids.length > 0) {
          this.usersService.getUsers().subscribe({
            next: (users: ResponseUserDto[]) => {
              this.responsibleUsers = {};
              users.forEach((u) => {
                if (ids.includes(u.id)) {
                  this.responsibleUsers[u.id] = u.name;
                }
              });
              this.loading = false;
            },
            error: () => {
              this.loading = false;
            },
          });
        } else {
          this.loading = false;
        }
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  edit(id: string) {
    this.router.navigate(['/functionalities', id, 'edit']);
  }

  confirmDelete(id: string) {
    const ok = window.confirm(
      'Tem certeza que deseja desativar esta funcionalidade?'
    );
    if (!ok) return;
    this.functionalitiesService.softDelete(id).subscribe({
      next: () => {
        alert('Funcionalidade desativada com sucesso');
        this.ngOnInit();
      },
      error: () => {
        alert('Erro ao desativar funcionalidade');
      },
    });
  }
}
