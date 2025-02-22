import { Component, signal, WritableSignal } from '@angular/core';
import { CustomersService } from './customers.service';
import { UserProfile } from '../../core/interfaces/user-profile.interface';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss',
  standalone: true,
  imports: [CommonModule]
})
export class CustomersComponent {
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
    console.log('Delete cliente:', id);
  }

  viewCustomer(id: string) {
    console.log('Visualizar cliente:', id);
  }

  editCustomer(id: string) {
    console.log('Editar cliente:', id);
  }
}
