import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CustomersService } from '../../services/customers.service';
import { UserProfile } from '../../../../core/interfaces/user-profile.interface';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-customer-create',
  templateUrl: './customer-create.component.html',
  styleUrls: ['./customer-create.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class CustomerCreateComponent {
  formData: Partial<UserProfile> = {};
  error: string | null = null;

  constructor(private customersService: CustomersService, private router: Router) {}

  submit() {
    this.customersService.createCustomer(this.formData).subscribe({
      next: () => this.router.navigate(['/customers']),
      error: (err) => this.error = 'Erro ao criar cliente'
    });
  }
}
