// Angular Core
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

// RxJS
import { Observable, debounceTime, map, withLatestFrom } from 'rxjs';

// Date utilities
import { addDays, formatISO } from 'date-fns';

// Services
import { AuthService } from '../../../../app/core/services/auth.service';
import { ToastService } from '../../../../app/core/services/toast.service';
import { ClientsService } from '../../../clients/services/clients.service';
import { FunctionalitiesService } from '../../../functionalities/services/functionalities.service';
import { UsersService } from '../../../users/services/users.service';
import { OrdersService } from '../../services/orders.service';

// Interfaces - Clients
import { Client } from '../../../clients/interfaces/client.interface';

// Interfaces - Functionalities
import { FunctionalityDto } from '../../../functionalities/interfaces/functionalities.interface';

// Interfaces - Users
import { UserProfile } from '../../../users/interfaces/user-profile.interface';
import { ResponseUserDto } from '../../../users/types/user.dto';

// Interfaces - Orders (shared models)
import {
  CreateOrderDto,
  PaymentMethod,
  OrderInstallment,
} from '../../../../app/shared/models/orders';

@Component({
  selector: 'app-orders-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './orders-create.component.html',
  styleUrls: ['./orders-create.component.scss'],
})
export class OrdersCreateComponent implements OnInit {
  orderForm!: FormGroup;
  clients$!: Observable<Client[]>;
  functionalities$!: Observable<FunctionalityDto[]>;
  assistants$!: Observable<ResponseUserDto[]>;
  currentUser!: UserProfile;

  paymentMethods: PaymentMethod[] = [
    'pix',
    'transfer',
    'deposit',
    'card',
    'other',
  ];
  // REQ 4: Limite de parcelas atualizado
  installmentsOptions = [1, 2, 3];

  constructor(
    private fb: FormBuilder,
    private clientsService: ClientsService,
    private functionalitiesService: FunctionalitiesService,
    private usersService: UsersService,
    private ordersService: OrdersService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Ordem importante:
    // 1. Construir o formulário (para que exista)
    this.buildForm();
    // 2. Carregar dados (que irão preencher o formulário, como o responsável)
    this.loadInitialData();
    // 3. Configurar listeners de mudanças
    this.setupFormListeners();
  }

  buildForm(): void {
    const today = new Date();
    const clientDeadlineDate = addDays(today, 10);
    const assistantDeadlineDate = addDays(today, 5);

    const contractDateDefault = today.toISOString().split('T')[0];
    const clientDeadlineDefault = clientDeadlineDate
      .toISOString()
      .split('T')[0];
    const assistantDeadlineDefault = assistantDeadlineDate
      .toISOString()
      .split('T')[0];

    this.orderForm = this.fb.group({
      clientId: [null, Validators.required],
      functionalityId: [null, Validators.required],
      // REQ 5: 'title' removido, 'description' adicionado
      description: [null, Validators.required],
      contractDate: [contractDateDefault, Validators.required],
      clientDeadline: [clientDeadlineDefault, Validators.required],
      assistantDeadline: [assistantDeadlineDefault],
      clientPrice: [null, [Validators.required, Validators.min(0)]],
      assistantPrice: [null, [Validators.min(0)]],
      paymentMethod: ['pix' as PaymentMethod, Validators.required],
      installments: [1, Validators.required],
      // REQ 2/3: Trocado 'responsibles' (array) por 'responsibleId' (valor único)
      // e 'responsibleName' (apenas exibição)
      responsibleId: [null, Validators.required],
      responsibleName: [null], // Campo de exibição, será desabilitado
      installmentsArray: this.fb.array([]),
    });

    this.recalculateInstallments();
  }

  loadInitialData(): void {
    this.clients$ = this.clientsService.getClients();
    this.functionalities$ = this.functionalitiesService.getAll();
    this.assistants$ = this.usersService.getUsers();

    // REQ 2/3: Carregar o usuário logado e preencher o campo responsável
    this.authService.getUserProfile().subscribe((user: UserProfile) => {
      this.currentUser = user;

      // Preenche os campos do responsável (Ex: "Brenda")
      this.orderForm.patchValue({
        responsibleId: user.id,
        responsibleName: user.name,
      });

      // Desabilita o campo de NOME (apenas exibição)
      this.orderForm.get('responsibleName')?.disable();
    });
  }

  setupFormListeners(): void {
    this.orderForm
      .get('clientPrice')
      ?.valueChanges.pipe(debounceTime(300))
      .subscribe(() => {
        this.recalculateInstallments();
      });

    this.orderForm.get('installments')?.valueChanges.subscribe(() => {
      this.recalculateInstallments();
    });
  }

  get installmentsArray(): FormArray {
    return this.orderForm.get('installmentsArray') as FormArray;
  }

  createInstallmentItem(
    value: number | null,
    dueDate: string | null
  ): FormGroup {
    return this.fb.group({
      value: [value, [Validators.required, Validators.min(0)]],
      dueDate: [dueDate, Validators.required],
    });
  }

  recalculateInstallments(): void {
    const installmentsCount = this.orderForm.get('installments')?.value || 1;
    const clientPrice = this.orderForm.get('clientPrice')?.value || 0;

    const installmentValue =
      clientPrice > 0 && installmentsCount > 0
        ? parseFloat((clientPrice / installmentsCount).toFixed(2))
        : null;

    this.installmentsArray.clear();
    const today = new Date();

    for (let i = 0; i < installmentsCount; i++) {
      const dueDate = addDays(today, (i + 1) * 30)
        .toISOString()
        .split('T')[0];

      this.installmentsArray.push(
        this.createInstallmentItem(installmentValue, dueDate)
      );
    }
  }

  onServiceSelected(functionalityId: string): void {
    if (!functionalityId) return;

    this.functionalities$
      .pipe(map((funcs) => funcs.find((f) => f.id === functionalityId)))
      .subscribe((func) => {
        if (!func) return;

        // ESTA ERA A LÓGICA ANTIGA QUE FUNCIONAVA
        // E VAMOS MANTÊ-LA, SÓ ADICIONANDO A ATUALIZAÇÃO DO RESPONSÁVEL

        // 1. Define o preço do cliente
        this.orderForm.patchValue({
          clientPrice: func.minimumPrice,
        });

        // 2. LÓGICA DO RESPONSÁVEL
        // Verificamos se o responsável PELO SERVIÇO (func.responsibleUserId)
        // é a usuária logada (this.currentUser.id)
        if (func.responsibleUserId === this.currentUser.id) {
          // Se for, o responsável é a usuária logada
          this.orderForm.patchValue({
            responsibleId: this.currentUser.id,
            responsibleName: this.currentUser.name,
            assistantPrice: null, // Zera o preço do assistente
          });

          // Desabilita o nome (pois é a própria usuária) e o preço do assistente
          this.orderForm.get('responsibleName')?.disable();
          this.orderForm.get('assistantPrice')?.disable();
        } else {
          // Se NÃO for, significa que é OUTRO assistente
          // (Aqui precisamos encontrar o nome do outro assistente)

          // ESTA PARTE É A NOVA - precisamos carregar a lista de assistentes
          this.assistants$.subscribe((assistants) => {
            const responsibleAssistant = assistants.find(
              (a) => a.id === func.responsibleUserId
            );

            this.orderForm.patchValue({
              responsibleId: func.responsibleUserId,
              responsibleName: responsibleAssistant
                ? responsibleAssistant.name
                : 'Assistente não encontrado',
              assistantPrice: func.defaultAssistantPrice, // Define o preço padrão
            });

            // Habilita os campos caso estivessem desabilitados
            this.orderForm.get('responsibleName')?.enable(); // Deixamos editar? Ou desabilitamos?
            // Por enquanto, vou deixar desabilitado para manter o padrão
            this.orderForm.get('responsibleName')?.disable();
            this.orderForm.get('assistantPrice')?.enable();
          });
        }
      });
  }

  resetForm(): void {
    this.buildForm();
    // Recarrega os dados para preencher o responsável novamente
    this.loadInitialData();
  }

  invalid(controlName: string): boolean {
    const control = this.orderForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  onSubmit(): void {
    if (this.orderForm.invalid) {
      this.toastService.error(
        'Formulário inválido. Verifique os campos obrigatórios.'
      );
      this.orderForm.markAllAsTouched();
      return;
    }

    // REQ 2/3: Usar getRawValue() para pegar TODOS os valores,
    // incluindo campos desabilitados (como responsibleId e assistantPrice).
    const formValue = this.orderForm.getRawValue();

    //
    // CORREÇÃO ESTÁ AQUI:
    //
    const payload: any = {
      // 1. Campos da "raiz" do CreateOrderDto
      clientId: formValue.clientId,
      contractDate: formValue.contractDate,
      description: formValue.description,
      paymentTerms: 'ONE',
      paymentMethod: formValue.paymentMethod, // <-- CORREÇÃO: Movido para a raiz

      // 2. Campos do 'items' (CreateOrderItemDto)
      items: [
        {
          functionalityId: formValue.functionalityId,
          price: parseFloat(formValue.clientPrice),
          // paymentMethod: formValue.paymentMethod, // <-- REMOVIDO DAQUI
          clientDeadline: formValue.clientDeadline,
          responsibleUserId: formValue.responsibleId,
          assistantDeadline: formValue.assistantDeadline,
          assistantAmount: formValue.assistantPrice
            ? parseFloat(formValue.assistantPrice)
            : undefined,
        },
      ],

      // 3. Dados das parcelas (que serão removidos depois)
      installments: formValue.installmentsArray.map((installment: any) => ({
        value: parseFloat(installment.value),
        dueDate: formatISO(new Date(installment.dueDate)),
      })),
    };

    // Remove propriedades do form que não fazem parte do payload final
    delete payload.installmentsArray;
    // Esta linha provavelmente está correta, pois o DTO de criação não pede parcelas
    delete payload.installments;
    delete payload.responsibleName; // Não precisamos enviar o nome, só o ID

    this.ordersService.create(payload).subscribe({
      next: () => {
        this.toastService.success('Pedido criado com sucesso!');
        this.router.navigate(['/orders']);
      },
      error: (err: any) => {
        console.error('Erro ao criar pedido:', err);
        // O erro 400 não deve mais acontecer, mas se acontecer, mostrará aqui
        const errorMsg = err.error?.message || 'Erro ao criar pedido.';
        this.toastService.error(
          Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg
        );
      },
    });
  }
}
