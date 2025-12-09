import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import { formatISO, addDays, parseISO, isValid } from 'date-fns';
import { Subscription, forkJoin, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
} from 'rxjs/operators';

// Core Services
import { AuthService } from '../../../../../app/core/services/auth.service';
import { ToastService } from '../../../../../app/core/services/toast.service';

// Feature Services
import { ClientsService } from '../../../clients/services/clients.service';
import { FunctionalitiesService } from '../../../functionalities/services/functionalities.service';
import { UsersService } from '../../../../admin/users/services/users.service';
import { OrdersService } from '../../services/orders.service';

// Models
import { CreateOrderDto } from '../../../../../app/shared/models/orders';

@Component({
  selector: 'app-orders-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './orders-create.component.html',
  styleUrls: ['./orders-create.component.scss'],
})
export class OrdersCreateComponent implements OnInit, OnDestroy {
  orderForm!: FormGroup;

  // Dados Carregados
  clients: any[] = [];
  functionalities: any[] = [];
  users: any[] = []; // Assistentes/Responsáveis
  currentUser: any = null;

  // Opções
  paymentMethods: string[] = [
    'PIX',
    'Cartão',
    'Dinheiro',
    'Transferência',
    'Cheque',
    'Outro',
  ];
  installmentPaymentMethods: string[] = [
    'BOLETO',
    'CREDIT_CARD',
    'PIX',
    'OTHER',
  ];
  installmentsOptions: number[] = [1, 2, 3, 4, 5];

  loading = false;
  submitting = false;

  // Controle de Subscriptions
  private subs = new Subscription();
  private isRecalculating = false; // Flag para evitar loop infinito no recálculo de parcelas

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService,
    private clientsService: ClientsService,
    private functionalitiesService: FunctionalitiesService,
    private usersService: UsersService,
    private ordersService: OrdersService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadDependenciesAndDefaults();
    this.setupGlobalListeners();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ============================================================
  // 1. CONSTRUÇÃO DO FORMULÁRIO (COM ARRAY DE ITEMS)
  // ============================================================
  private buildForm() {
    const today = new Date().toISOString().split('T')[0];

    this.orderForm = this.fb.group({
      clientId: [null, Validators.required],
      contractDate: [today, Validators.required],
      description: ['Trabalho Acadêmico', Validators.required], // Valor padrão da master
      hasInvoice: [false],

      // Arrays
      items: this.fb.array([]), // Lista de Serviços
      installmentsList: this.fb.array([]), // Lista de Parcelas

      // Controles Financeiros Gerais
      installmentsCount: [1, Validators.required],
      totalValue: [{ value: 0, disabled: true }], // Campo calculado
    });

    // Adiciona o primeiro item vazio por padrão
    this.addItem();
  }

  // Cria um Grupo de Controle para um Item de Serviço
  private createItemRequest(): FormGroup {
    const today = new Date();
    const defaultClientDeadline = addDays(today, 10)
      .toISOString()
      .split('T')[0];
    const defaultAssistantDeadline = addDays(today, 5)
      .toISOString()
      .split('T')[0];

    const group = this.fb.group({
      functionalityId: ['', Validators.required],
      clientDeadline: [defaultClientDeadline, Validators.required],
      assistantDeadline: [defaultAssistantDeadline],

      // Financeiro do Item
      clientPrice: [0, [Validators.required, Validators.min(0)]],
      assistantPrice: [0, [Validators.min(0)]],

      // Responsável
      responsibleId: [''],
      responsibleName: [''], // Apenas exibição
    });

    // Listener para recalcular total quando preço mudar
    this.subs.add(
      group
        .get('clientPrice')
        ?.valueChanges.pipe(debounceTime(300))
        .subscribe(() => {
          this.updateTotalValue();
        })
    );

    return group;
  }

  // Cria um Grupo de Controle para uma Parcela
  private createInstallmentGroup(
    amount: number,
    date: string,
    method: string
  ): FormGroup {
    const group = this.fb.group({
      amount: [amount, [Validators.required, Validators.min(0.01)]],
      dueDate: [date, Validators.required],
      paymentMethod: [method, Validators.required],
      paymentMethodDescription: [''],
    });

    // Listener individual para recálculo inteligente ao editar valor manual
    this.subs.add(
      group
        .get('amount')
        ?.valueChanges.pipe(debounceTime(400), distinctUntilChanged())
        .subscribe((newVal) => {
          if (newVal == null) {
            return;
          }
          if (!this.isRecalculating) {
            this.handleManualInstallmentChange(group, newVal);
          }
        })
    );

    return group;
  }

  // ============================================================
  // 2. CARREGAMENTO DE DADOS E REGRAS DE NEGÓCIO (MASTER)
  // ============================================================
  private loadDependenciesAndDefaults() {
    this.loading = true;

    // ForkJoin para carregar tudo em paralelo
    forkJoin({
      clients: this.clientsService.getClients().pipe(catchError(() => of([]))),
      funcs: this.functionalitiesService
        .getFunctionalities()
        .pipe(catchError(() => of([]))),
      users: this.usersService.getUsers().pipe(catchError(() => of([]))),
      currentUser: this.authService.getUserCached(), // Método otimizado do AuthService
    }).subscribe({
      next: (data) => {
        this.clients = data.clients;
        this.functionalities = data.funcs;
        this.users = data.users;
        this.currentUser = data.currentUser;

        // REGRA 1: Selecionar último cliente cadastrado
        if (this.clients.length > 0) {
          // Assumindo que a API retorna ordenado ou o último adicionado é o primeiro/último
          // Se for ordem de criação DESC (mais comum em listas recentes):
          const lastClient = this.clients[0];
          // Se for ASC (antigos primeiro): const lastClient = this.clients[this.clients.length - 1];

          this.orderForm.patchValue({ clientId: lastClient.id });
        }

        // REGRA 2: Se o usuário logado tiver uma funcionalidade associada, pré-selecionar no primeiro item
        if (this.currentUser && this.functionalities.length > 0) {
          const userFunc = this.functionalities.find(
            (f) => f.responsibleUserId === this.currentUser.id
          );
          if (userFunc) {
            this.setItemService(0, userFunc.id);
          }
        }

        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.toastService.error('Erro ao carregar dados iniciais.');
        this.loading = false;
      },
    });
  }

  // ============================================================
  // 3. GETTERS E HELPERS DE FORMARRAY
  // ============================================================
  get items(): FormArray {
    return this.orderForm.get('items') as FormArray;
  }

  get installmentsList(): FormArray {
    return this.orderForm.get('installmentsList') as FormArray;
  }

  addItem() {
    this.items.push(this.createItemRequest());
    this.updateTotalValue();
  }

  removeItem(index: number) {
    this.items.removeAt(index);
    this.updateTotalValue();
  }

  // ============================================================
  // 4. LÓGICA DE SELEÇÃO DE SERVIÇO (POR ITEM)
  // ============================================================
  onServiceSelected(index: number, funcId: string) {
    this.setItemService(index, funcId);
  }

  private setItemService(index: number, funcId: string) {
    const func = this.functionalities.find((f) => f.id === funcId);
    if (!func) return;

    const itemGroup = this.items.at(index) as FormGroup;

    // Calcula Prazos
    const today = new Date();
    const days = func.daysToDeliver || 10;
    const targetDate = addDays(today, days).toISOString().split('T')[0];

    // Define Preços
    const price = func.minimumPrice || 0;
    const assistantPrice = func.defaultAssistantPrice || 0;

    // Define Responsável
    let respId = func.responsibleUserId || '';
    let respName = '';

    // Regra da Master: Se o responsável for o usuário logado
    if (this.currentUser && respId === this.currentUser.id) {
      respName = this.currentUser.name;
    } else if (respId) {
      const u = this.users.find((u) => u.id === respId);
      respName = u ? u.name : 'Assistente Externo';
    }

    // Patch dos valores
    itemGroup.patchValue({
      functionalityId: func.id, // Garante que o select visualiza
      clientPrice: price,
      assistantPrice: assistantPrice,
      clientDeadline: targetDate,
      responsibleId: respId,
      responsibleName: respName,
    });

    // Se o responsável é o logado, zera custo assistente? (Regra opcional, mantive a da master)
    if (this.currentUser && respId === this.currentUser.id) {
      itemGroup.patchValue({ assistantPrice: 0 });
      itemGroup.get('assistantPrice')?.disable();
    } else {
      itemGroup.get('assistantPrice')?.enable();
    }

    this.updateTotalValue();
  }

  // ============================================================
  // 5. GESTÃO FINANCEIRA E PARCELAS
  // ============================================================
  private setupGlobalListeners() {
    // Quando mudar o número de parcelas, regenerar tudo (máximo 5)
    this.orderForm.get('installmentsCount')?.valueChanges.subscribe((count) => {
      // Limita a 5 parcelas máximo
      const limitedCount = Math.min(count, 5);
      if (limitedCount !== count) {
        this.orderForm.get('installmentsCount')?.setValue(limitedCount, {
          emitEvent: false,
        });
      }
      this.generateInstallments(limitedCount);
    });
  }

  private updateTotalValue() {
    const items = this.items.getRawValue();
    const total = items.reduce(
      (acc: number, curr: any) => acc + (parseFloat(curr.clientPrice) || 0),
      0
    );

    this.orderForm.get('totalValue')?.setValue(total);

    // Regenera parcelas com o novo total
    const count = this.orderForm.get('installmentsCount')?.value || 1;
    this.generateInstallments(count);
  }

  // Gera parcelas iniciais (divisão igualitária)
  private generateInstallments(count: number) {
    this.isRecalculating = true;
    const total = this.orderForm.get('totalValue')?.value || 0;
    const today = new Date();

    this.installmentsList.clear();

    if (total <= 0) {
      this.isRecalculating = false;
      return;
    }

    const baseAmount = Math.floor((total / count) * 100) / 100; // Arredonda para baixo 2 casas
    let accumulated = 0;

    for (let i = 0; i < count; i++) {
      let amount = baseAmount;

      // Ajuste de centavos na última parcela
      if (i === count - 1) {
        amount = parseFloat((total - accumulated).toFixed(2));
      } else {
        accumulated += amount;
      }

      // Datas: Hoje, +30, +60...
      const date = addDays(today, i * 30)
        .toISOString()
        .split('T')[0];

      // Método: Primeiro PIX, resto o que estiver no array ou padrão PIX
      // (Regra solicitada: "primeira pix, demais cheque")
      // Aqui colocamos um padrão inicial, mas o usuário pode mudar
      const defaultMethod = 'PIX';

      this.installmentsList.push(
        this.createInstallmentGroup(amount, date, defaultMethod)
      );
    }
    this.isRecalculating = false;
  }

  // Verifica se pode adicionar mais parcelas (máximo 5)
  canAddInstallments(): boolean {
    return this.installmentsList.length < 5;
  }

  // Lógica Inteligente: Recalcular parcelas restantes ao mudar uma manualmente
  private handleManualInstallmentChange(
    changedGroup: FormGroup,
    newValue: number
  ) {
    this.isRecalculating = true;

    const total = this.orderForm.get('totalValue')?.value || 0;
    const allControls = this.installmentsList.controls as FormGroup[];
    const changedIndex = allControls.indexOf(changedGroup);

    // Soma do que já foi definido "manualmente" ou fixo nas parcelas ANTERIORES e na ATUAL
    // Na verdade, a regra mais simples é: O que sobrou, divide igualmente nas parcelas SEGUINTES.

    if (changedIndex === allControls.length - 1) {
      // Se alterou a última, infelizmente não tem pra onde jogar a diferença.
      // Poderíamos validar erro ou ajustar a penúltima, mas vamos apenas aceitar por enquanto.
      this.isRecalculating = false;
      return;
    }

    // Calcula quanto sobra para as parcelas seguintes
    let currentSum = 0;
    for (let i = 0; i <= changedIndex; i++) {
      currentSum += parseFloat(allControls[i].get('amount')?.value || 0);
    }

    const remainingTotal = total - currentSum;
    const remainingCount = allControls.length - 1 - changedIndex;

    if (remainingTotal < 0) {
      // Valor estourou o total
      this.toastService.warning(
        'A soma das parcelas ultrapassou o valor total do pedido.'
      );
      // Opcional: Resetar valor
    } else {
      // Distribui o restante nas próximas
      const nextBase =
        Math.floor((remainingTotal / remainingCount) * 100) / 100;
      let nextAccumulated = 0;

      for (let i = changedIndex + 1; i < allControls.length; i++) {
        let amount = nextBase;
        if (i === allControls.length - 1) {
          amount = parseFloat((remainingTotal - nextAccumulated).toFixed(2));
        } else {
          nextAccumulated += amount;
        }

        // Atualiza sem disparar evento (emitEvent: false não funciona bem com valueChanges subscription,
        // por isso usamos a flag isRecalculating)
        allControls[i].patchValue({ amount: amount });
      }
    }

    this.isRecalculating = false;
  }

  // ============================================================
  // 6. SUBMISSÃO
  // ============================================================
  onSubmit() {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      this.toastService.warning(
        'Verifique os campos obrigatórios em vermelho.'
      );
      return;
    }

    this.submitting = true;
    const formVal = this.orderForm.getRawValue();

    // 1. Definição do Método de Pagamento Principal (Raiz)
    // Pega o da primeira parcela ou padrão 'PIX'
    const rawPaymentMethod =
      formVal.installmentsList[0]?.paymentMethod || 'PIX';
    const cleanPaymentMethod = this.mapToBackendPaymentMethod(rawPaymentMethod);

    // 2. Mapeamento dos Items
    const itemsPayload = formVal.items.map((item: any) => {
      const payloadItem: any = {
        functionalityId: item.functionalityId,
        price: parseFloat(item.clientPrice),
        clientDeadline: new Date(item.clientDeadline).toISOString(),
        assistantAmount: parseFloat(item.assistantPrice || 0),
      };

      if (item.assistantDeadline) {
        payloadItem.assistantDeadline = new Date(
          item.assistantDeadline
        ).toISOString();
      }

      // IMPORTANTE: Só envia responsibleUserId se tiver valor real (evita erro de UUID)
      if (item.responsibleId && item.responsibleId.length > 5) {
        payloadItem.responsibleUserId = item.responsibleId;
      }

      return payloadItem;
    });

    // 3. Mapeamento das Parcelas
    // Remove sequence e traduz channel
    const installmentsPayload = formVal.installmentsList.map((inst: any) => ({
      amount: parseFloat(inst.amount),
      dueDate: new Date(inst.dueDate).toISOString(),
      channel: this.mapToBackendChannel(inst.paymentMethod),
      paymentMethod: inst.paymentMethod,
      paymentMethodDescription:
        inst.paymentMethod === 'OTHER'
          ? inst.paymentMethodDescription
          : undefined,
    }));

    // 4. Montagem Final do Payload
    const payload: CreateOrderDto = {
      clientId: formVal.clientId,
      contractDate: new Date(formVal.contractDate).toISOString(),
      description: formVal.description,
      hasInvoice: formVal.hasInvoice || false,
      paymentMethod: cleanPaymentMethod as any,
      items: itemsPayload,
      installments: installmentsPayload,
    };

    console.log('Payload Enviado:', payload);

    this.ordersService.create(payload).subscribe({
      next: () => {
        this.toastService.success('Ordem de serviço criada com sucesso!');
        this.router.navigate(['/orders']);
      },
      error: (err) => {
        console.error('Erro Backend:', err);
        // Tratamento para array de mensagens do class-validator
        const msg = err.error?.message || 'Erro ao processar pedido.';
        this.toastService.error(Array.isArray(msg) ? msg.join('\n') : msg);
        this.submitting = false;
      },
    });
  }

  // --- Helpers de Tradução (UI -> DTO) ---

  private mapToBackendPaymentMethod(uiMethod: string): string {
    const map: Record<string, string> = {
      PIX: 'pix',
      Cartão: 'card',
      Dinheiro: 'deposit',
      Transferência: 'transfer',
      Cheque: 'other',
      Outro: 'other',
    };
    return map[uiMethod] || 'other';
  }

  private mapToBackendChannel(uiMethod: string): string {
    const map: Record<string, string> = {
      PIX: 'pix',
      Cartão: 'card',
      Dinheiro: 'deposit',
      Transferência: 'transfer',
      Cheque: 'boleto', // Boleto é mais próximo de documento em papel/cheque
      Outro: 'other',
    };
    return map[uiMethod] || 'other';
  }

  // Helpers de Template
  isInvalid(control: AbstractControl | null): boolean {
    return !!(control && control.invalid && (control.touched || control.dirty));
  }
}
