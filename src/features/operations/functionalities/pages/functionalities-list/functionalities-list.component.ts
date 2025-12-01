import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

// Feature Services & Interfaces
import { FunctionalitiesService } from '../../services/functionalities.service';
import { FunctionalityDto } from '../../interfaces/functionalities.interface';

// Core
import { AuthService } from '../../../../../app/core/services/auth.service';
import { UsersService } from '../../../../admin/users/services/users.service';
import { ResponseUserDto } from '../../../../admin/users/types/user.dto';

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
    // 1. Identifica o usuário logado via Estado (sem requisição extra)
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.currentUserId = user.id;
        this.currentUserName = user.name;
      }
    });

    // 2. Carrega as funcionalidades
    this.loadData();
  }

  private loadData() {
    this.functionalitiesService.getAll().subscribe({
      next: (data) => {
        this.functionalities = data;

        // Extrai IDs únicos de responsáveis para buscar seus nomes
        const ids = Array.from(
          new Set(data.map((f) => f.responsibleUserId).filter(Boolean))
        ) as string[];

        if (ids.length > 0) {
          this.loadResponsibleNames(ids);
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Erro ao carregar funcionalidades', err);
        this.loading = false;
      },
    });
  }

  private loadResponsibleNames(ids: string[]) {
    // O ideal seria um endpoint que aceitasse array de IDs, mas vamos usar o getUsers cacheado ou filtrado
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
        // Falha silenciosa na busca de nomes, mostra apenas os dados principais
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
        this.loadData(); // Recarrega a lista
      },
      error: (err) =>
        alert(
          'Erro ao desativar: ' + (err.error?.message || 'Erro desconhecido')
        ),
    });
  }
}
