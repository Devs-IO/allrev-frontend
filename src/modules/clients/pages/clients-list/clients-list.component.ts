import { Component, signal, WritableSignal } from '@angular/core';
import { ClientsService } from '../../services/clients.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Client } from '../../interfaces/client.interface';

@Component({
  selector: 'app-clients-list',
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.scss',
  standalone: true,
  imports: [CommonModule],
})
export class ClientsListComponent {
  clients: WritableSignal<Client[]> = signal<Client[]>([]);

  constructor(private clientsService: ClientsService, private router: Router) {}

  ngOnInit() {
    this.loadClients();
  }

  loadClients() {
    this.clientsService.getClients().subscribe((data) => {
      return this.clients.set(data);
    });
  }

  deleteClients(id: string) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      this.clientsService.deleteClients(id).subscribe({
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
