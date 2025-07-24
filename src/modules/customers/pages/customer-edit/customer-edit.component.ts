import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomersService } from '../../services/customers.service';
import { Client } from '../../interfaces/client.interface';

@Component({
  selector: 'app-customer-edit',
  templateUrl: './customer-edit.component.html',
  styleUrls: ['./customer-edit.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class CustomerEditComponent implements OnInit {
  customer: Client | null = null;
  formData: Partial<Client> = {};
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private customersService: CustomersService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.customersService.getCustomerById(id).subscribe({
        next: (customer) => {
          this.customer = customer;
          this.formData = { ...customer };
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
    if (this.customer) {
      this.customersService
        .updateCustomer(this.customer.id, this.formData)
        .subscribe({
          next: () => this.router.navigate(['/customers']),
          error: (err) => (this.error = 'Erro ao atualizar cliente'),
        });
    }
  }
}
