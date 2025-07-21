import { Component, signal, WritableSignal } from '@angular/core';
import { CustomersService } from '../../services/customers.service';
import { UserProfile } from '../../../../core/interfaces/user-profile.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customers-list',
  templateUrl: './customers-list.component.html',
  styleUrl: './customers-list.component.scss',
  standalone: true,
  imports: [CommonModule],
})
export class CustomersListComponent {
  customers: WritableSignal<UserProfile[]> = signal<UserProfile[]>([]);

  constructor(private customersService: CustomersService) {}

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.customersService.getCustomers().subscribe((data) => {
      return this.customers.set(data);
    });
  }

  deleteCustomer(id: string) {
    // Implementar lógica de exclusão
  }

  viewCustomer(id: string) {
    // Implementar lógica de visualização
  }

  editCustomer(id: string) {
    // Implementar lógica de edição
  }
}
