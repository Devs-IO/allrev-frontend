import { Component, OnInit } from '@angular/core';
import { ClientsService } from '../../services/clients.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Client } from '../../interfaces/client.interface';
import { finalize, take } from 'rxjs/operators';

@Component({
  selector: 'app-clients-list',
  templateUrl: './clients-list.component.html',
  styleUrls: ['./clients-list.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class ClientsListComponent implements OnInit {
  // Estados: dados, loading e erro
  clients: Client[] = [];
  loading = false;
  error: string | null = null;

  constructor(private clientsService: ClientsService, private router: Router) {}

  ngOnInit() {
    this.loadClients();
  }

  loadClients() {
    this.loading = true;
    this.error = null;

    this.clientsService
      .getClients()
      .pipe(
        take(1), // evita múltiplas subs durante filtros/paginação
        finalize(() => (this.loading = false)) // garante que loading será desligado
      )
      .subscribe({
        next: (resp) => {
          this.clients = resp || [];
          this.error = null;
        },
        error: () => {
          this.error = 'Falha ao carregar clientes.';
          this.clients = [];
        },
      });
  }

  deleteClients(id: string) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      this.clientsService
        .deleteClients(id)
        .pipe(take(1))
        .subscribe({
          next: () => this.loadClients(),
          error: () => alert('Erro ao excluir cliente'),
        });
    }
  }

  viewClients(id: string) {
    this.router.navigate(['/clients', id]);
  }

  editClients(id: string) {
    this.router.navigate(['/clients', id, 'edit']);
  }
}
