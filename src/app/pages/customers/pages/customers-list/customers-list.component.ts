import { Component, signal, WritableSignal } from '@angular/core';
import { CustomersService } from '../../services/customers.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Client } from '../../interfaces/client.interface';

@Component({
  selector: 'app-customers-list',
  templateUrl: './customers-list.component.html',
  styleUrl: './customers-list.component.scss',
  standalone: true,
  imports: [CommonModule],
})
export class CustomersListComponent {
  customers: WritableSignal<Client[]> = signal<Client[]>([]);

  constructor(
    private customersService: CustomersService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.customersService.getCustomers().subscribe((data) => {
      return this.customers.set(data);
    });
  }

  deleteCustomer(id: string) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      this.customersService.deleteCustomer(id).subscribe({
        next: () => this.loadCustomers(),
        error: () => alert('Erro ao excluir cliente'),
      });
    }
  }

  viewCustomer(id: string) {
    this.router.navigate(['/customers', id]);
  }

  editCustomer(id: string) {
    this.router.navigate(['/customers', id, 'edit']);
  }
}
