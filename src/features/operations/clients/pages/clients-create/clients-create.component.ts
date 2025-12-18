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
    legalNature: undefined,
    cpf: undefined,
    cnpj: undefined,
  };
  sendPassword = true;
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

        // Extrai o Tenant ID baseado no role do usuário
        let tenantId = '';

        // Se for Gestor, pega o tenant do objeto tenant.id
        if ((user as any).tenant?.id) {
          tenantId = (user as any).tenant.id;
        }
        // Se for Assistente, pega o primeiro tenant disponível
        else if (
          Array.isArray((user as any).tenants) &&
          (user as any).tenants.length > 0
        ) {
          tenantId = (user as any).tenants[0].tenantId;
        }
        // Se for Admin, pode deixar em branco (não precisa de tenant)
        else if (
          !(user as any).isAdmin &&
          !(user as any).role?.includes('admin')
        ) {
          // Não é admin e não tem tenant
          this.error = 'Erro: Usuário sem empresa vinculada.';
          this.loading = false;
          return;
        }

        if (tenantId) {
          this.formData.tenantId = tenantId;
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
    const payload = {
      ...this.formData,
      sendPassword: this.sendPassword,
    } as any;

    this.clientsService.createClients(payload).subscribe({
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
