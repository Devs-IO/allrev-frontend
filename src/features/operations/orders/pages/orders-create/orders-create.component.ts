import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormArray,
} from '@angular/forms';
import { Router } from '@angular/router';
import { formatISO } from 'date-fns';

// Core Services
import { AuthService } from '../../../../../app/core/services/auth.service';
import { ToastService } from '../../../../../app/core/services/toast.service';

// Feature Services
import { ClientsService } from '../../../clients/services/clients.service';
import { FunctionalitiesService } from '../../../functionalities/services/functionalities.service';

import { OrdersService } from '../../services/orders.service';

// Tipos
import { CreateOrderDto } from '../../../../../app/shared/models/orders';
import { UsersService } from '../../../../admin/users/services/users.service';

@Component({
  selector: 'app-orders-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './orders-create.component.html',
  styleUrls: ['./orders-create.component.scss'],
})
export class OrdersCreateComponent implements OnInit {
  orderForm: FormGroup;

  clients: any[] = [];
  functionalities: any[] = [];
  users: any[] = []; // Responsáveis/Assistentes

  // Streams used by template with async pipe
  clients$ = this.clientsService.getClients();
  functionalities$ = this.functionalitiesService.getFunctionalities();

  // Finance options used in template
  paymentMethods: string[] = ['PIX', 'Cartão', 'Dinheiro', 'Transferência'];
  installmentsOptions: number[] = [1, 2, 3, 4, 5, 6, 10, 12];

  loading = false;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService,
    private clientsService: ClientsService,
    private functionalitiesService: FunctionalitiesService,
    private usersService: UsersService,
    private ordersService: OrdersService
  ) {
    this.orderForm = this.fb.group({
      clientId: ['', Validators.required],
      functionalityId: ['', Validators.required], // Serviço
      clientDeadline: ['', Validators.required], // Prazo Cliente
      assistantDeadline: ['', Validators.required],
      description: ['', Validators.required],
      // Responsável
      responsibleId: [''],
      responsibleName: [''],

      // Datas/Contrato
      contractDate: [''],

      // Financeiro
      clientPrice: [0, [Validators.required, Validators.min(0)]], // Preço Cliente
      assistantPrice: [0], // Custo Assistente
      paymentMethod: [this.paymentMethods[0], Validators.required],
      installments: [1, Validators.required],

      // Parcelas geradas
      installmentsArray: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.loadDependencies();
    this.setupAutoFill();
  }

  private loadDependencies() {
    this.loading = true;

    // Carrega dados iniciais
    this.clientsService.getClients().subscribe((data) => (this.clients = data));
    this.functionalitiesService
      .getFunctionalities()
      .subscribe((data) => (this.functionalities = data));
    this.usersService.getUsers().subscribe((data) => (this.users = data));

    this.loading = false;
  }

  private setupAutoFill() {
    // Quando seleciona funcionalidade, preenche preço sugerido
    this.orderForm.get('functionalityId')?.valueChanges.subscribe((funcId) => {
      const func = this.functionalities.find((f) => f.id === funcId);
      if (func) {
        this.orderForm.patchValue({
          clientPrice: func.minimumPrice || 0,
          assistantPrice: func.defaultAssistantPrice || 0,
        });
      }
    });

    // Regenera parcelas quando muda quantidade ou valor
    this.orderForm.get('installments')?.valueChanges.subscribe((qty) => {
      this.generateInstallments(+qty || 1);
    });
    this.orderForm.get('clientPrice')?.valueChanges.subscribe(() => {
      const qty = +this.orderForm.get('installments')?.value || 1;
      this.generateInstallments(qty);
    });
  }

  onSubmit() {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const form = this.orderForm.value;

    // Monta o Payload conforme esperado pelo Backend (DTO)
    const payload: CreateOrderDto = {
      clientId: form.clientId,
      items: [
        {
          functionalityId: form.functionalityId,
          price: parseFloat(form.clientPrice),
          clientDeadline: new Date(form.clientDeadline).toISOString(),

          // Dados de responsabilidade
          responsibleUserId: form.responsibleId,
          assistantDeadline: new Date(form.assistantDeadline).toISOString(),
          assistantAmount: parseFloat(form.assistantPrice || 0),
        },
      ],
      // Se tiver campo de observação na ordem raiz
      description: form.description,
      contractDate: form.contractDate
        ? new Date(form.contractDate).toISOString()
        : '',
    };

    this.ordersService.create(payload).subscribe({
      next: () => {
        this.toastService.success('Trabalho criado com sucesso!');
        this.router.navigate(['/orders']);
      },
      error: (err) => {
        console.error(err);
        this.toastService.error('Erro ao criar trabalho. Verifique os dados.');
        this.submitting = false;
      },
    });
  }

  // Utilitários usados no template
  invalid(controlName: string): boolean {
    const ctrl = this.orderForm.get(controlName);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  get installmentsArray(): FormArray {
    return this.orderForm.get('installmentsArray') as FormArray;
  }

  resetForm() {
    this.orderForm.reset({
      clientId: '',
      functionalityId: '',
      clientDeadline: '',
      assistantDeadline: '',
      description: '',
      responsibleId: '',
      responsibleName: '',
      contractDate: '',
      clientPrice: 0,
      assistantPrice: 0,
      paymentMethod: this.paymentMethods[0],
      installments: 1,
    });
    this.installmentsArray.clear();
    this.generateInstallments(1);
  }

  onServiceSelected(funcId: string | number) {
    const id = typeof funcId === 'string' ? Number(funcId) : funcId;
    const func = this.functionalities.find((f) => f.id === id);
    if (func) {
      this.orderForm.patchValue({
        clientPrice: func.minimumPrice || 0,
        assistantPrice: func.defaultAssistantPrice || 0,
      });
    }
  }

  private generateInstallments(qty: number) {
    const total = parseFloat(this.orderForm.get('clientPrice')?.value || 0);
    const todayISO = formatISO(new Date(), { representation: 'date' });
    this.installmentsArray.clear();
    const per = qty > 0 ? +(total / qty).toFixed(2) : total;
    for (let i = 0; i < (qty || 1); i++) {
      this.installmentsArray.push(
        this.fb.group({
          value: [per, [Validators.required, Validators.min(0)]],
          dueDate: [todayISO, Validators.required],
        })
      );
    }
  }
}
