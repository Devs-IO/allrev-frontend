import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { take } from 'rxjs/operators';

// Services & Core
import { ClientsService } from '../../services/clients.service';
import { Client } from '../../interfaces/client.interface';
import { AuthService } from '../../../../../app/core/services/auth.service';
import { PhoneMaskDirective } from '../../../../../app/shared/directives/phone-mask.directive';

@Component({
  selector: 'app-clients-create',
  templateUrl: './clients-create.component.html',
  styleUrls: ['./clients-create.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PhoneMaskDirective],
})
export class ClientsCreateComponent {
  formData: Partial<Client> = {
    isActive: true,
    legalNature: undefined,
    cpf: undefined,
    cnpj: undefined,
  };
  error: string | null = null;
  loading = false;

  constructor(
    private clientsService: ClientsService,
    private router: Router,
    private authService: AuthService
  ) {}

  submit() {
    this.loading = true;
    this.error = null;

    // Pega o usuário atual uma única vez para extrair o TenantID
    this.authService.currentUser$.pipe(take(1)).subscribe({
      next: (user) => {
        if (!user) {
          this.error = 'Sessão inválida. Faça login novamente.';
          this.loading = false;
          return;
        }

        // Tenta extrair o Tenant ID de várias fontes possíveis no objeto User
        // 1. Propriedade direta tenantId (padrão DTO login)
        // 2. Objeto tenant aninhado (se houver populate)
        const tenantId = user.tenantIds || (user as any).tenant?.id;

        if (tenantId) {
          this.formData.tenantId = tenantId;
        } else if (!user.isAdmin) {
          // Se não é admin e não tem tenant, é erro de cadastro
          this.error = 'Erro: Usuário sem empresa vinculada.';
          this.loading = false;
          return;
        }

        this.createClient();
      },
      error: () => {
        this.error = 'Erro ao verificar sessão.';
        this.loading = false;
      },
    });
  }

  private createClient() {
    this.clientsService.createClients(this.formData).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/clients']);
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        this.error =
          err.error?.message || 'Erro ao criar cliente. Verifique os dados.';
      },
    });
  }
}
