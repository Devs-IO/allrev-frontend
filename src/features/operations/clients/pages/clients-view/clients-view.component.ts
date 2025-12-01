import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientsService } from '../../services/clients.service';
import { Client } from '../../interfaces/client.interface';

@Component({
  selector: 'app-clients-view',
  templateUrl: './clients-view.component.html',
  styleUrls: ['./clients-view.component.scss'],
  standalone: true,
  imports: [CommonModule, DatePipe],
})
export class ClientsViewComponent implements OnInit {
  clients: Client | null = null;
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
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Erro ao carregar cliente';
          this.loading = false;
        },
      });
    }
  }

  back() {
    this.router.navigate(['/clients']);
  }
}
