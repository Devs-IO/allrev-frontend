import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientsService } from '../../services/clients.service';
import { Client } from '../../interfaces/client.interface';

@Component({
  selector: 'app-clients-edit',
  templateUrl: './clients-edit.component.html',
  styleUrls: ['./clients-edit.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class ClientsEditComponent implements OnInit {
  clients: Client | null = null;
  formData: Partial<Client> = {};
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private clientsService: ClientsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.clientsService.getClientsById(id).subscribe({
        next: (clients) => {
          this.clients = clients;
          this.formData = { ...clients };
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Erro ao carregar cliente';
          this.loading = false;
        },
      });
    }
  }

  submit() {
    if (this.clients) {
      this.clientsService
        .updateClients(this.clients.id, this.formData)
        .subscribe({
          next: () => this.router.navigate(['/clients']),
          error: (err) => (this.error = 'Erro ao atualizar cliente'),
        });
    }
  }
}
