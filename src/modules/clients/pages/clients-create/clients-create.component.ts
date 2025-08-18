import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ClientsService } from '../../services/clients.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Client } from '../../interfaces/client.interface';
import { AuthService } from '../../../../app/core/services/auth.service';
import { PhoneMaskDirective } from '../../../../app/core/directives/phone-mask.directive';
@Component({
  selector: 'app-clients-create',
  templateUrl: './clients-create.component.html',
  styleUrls: ['./clients-create.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PhoneMaskDirective],
})
export class ClientsCreateComponent {
  formData: Partial<Client> = {};
  error: string | null = null;

  constructor(
    private clientsService: ClientsService,
    private router: Router,
    private authService: AuthService
  ) {}

  submit() {
    this.authService.getUserProfile().subscribe({
      next: (user) => {
        const tenant = (user as any).tenant;
        if (tenant?.id) {
          (this as any).formData.tenantId = tenant.id;
        }

        this.clientsService.createClients(this.formData).subscribe({
          next: () => this.router.navigate(['/clients']),
          error: (err) => (this.error = 'Erro ao criar cliente'),
        });
      },
      error: () => {},
    });
  }
}
