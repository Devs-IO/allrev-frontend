import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CustomersService } from '../../services/customers.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Client } from '../../interfaces/client.interface';
import { AuthService } from '../../../../core/services/auth.service';
@Component({
  selector: 'app-customer-create',
  templateUrl: './customer-create.component.html',
  styleUrls: ['./customer-create.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class CustomerCreateComponent {
  formData: Partial<Client> = {};
  error: string | null = null;

  constructor(
    private customersService: CustomersService,
    private router: Router,
    private authService: AuthService
  ) {}

  submit() {
    this.authService.getUserProfile().subscribe({
      next: (user) => {
        console.log(user);
        this.formData.tenantId = user.tenant?.id;
        this.customersService.createCustomer(this.formData).subscribe({
          next: () => this.router.navigate(['/customers']),
          error: (err) => (this.error = 'Erro ao criar cliente'),
        });
      },
      error: () => (this.error = 'Erro ao obter tenant do usuário'),
    });
  }
}
