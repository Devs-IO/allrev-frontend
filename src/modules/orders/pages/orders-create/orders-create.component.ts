import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../app/core/services/auth.service';
import { OrdersService } from '../../services/orders.service';
import { ClientsService } from '../../../clients/services/clients.service';
import { FunctionalitiesService } from '../../../functionalities/services/functionalities.service';
import { BrDatepickerDirective } from '../../../../app/core/directives/br-datepicker.directive';
import { ToastService } from '../../../../app/core/services/toast.service';
import { Observable, map } from 'rxjs';
import { Client } from '../../../clients/interfaces/client.interface';
// Aliases requested
import type { Client as IClient } from '../../../clients/interfaces/client.interface';
import type { FunctionalityDto as IFunctionality } from '../../../functionalities/interfaces/functionalities.interface';
import type { User as IUser } from '../../../users/interfaces/user.interface';
import { UsersService } from '../../../users/services/users.service';
import { FunctionalityDto } from '../../../functionalities/interfaces/functionalities.interface';
import { ResponseUserDto } from '../../../users/types/user.dto';
import { Role } from '../../../users/interfaces/user.enums';
import {
  CreateOrderDto,
  CreateOrderItemDto,
  OrderResponseDto,
  PaymentTerms,
} from '../../../../app/shared/models/orders';

@Component({
  selector: 'app-orders-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BrDatepickerDirective],
  // changeDetection: ChangeDetectionStrategy.OnPush, // TEMPORARIAMENTE REMOVIDO PARA DEBUG
  styleUrls: ['./orders-create.component.scss'],
  templateUrl: './orders-create.component.html',
})
export class OrdersCreateComponent implements OnInit, OnDestroy {
  // services retained via inject when not in the requested constructor block
  private destroyRef = inject(DestroyRef);
  private auth = inject(AuthService);

  // Observables and form (as requested)
  orderForm!: FormGroup;
  clients$!: Observable<IClient[]>;
  functionalities$!: Observable<IFunctionality[]>;
  assistants$!: Observable<IUser[]>;
  // Lista de usuários que podem ser responsáveis (Dono + Assistentes)
  responsibleUsers$!: Observable<IUser[]>; // TODO: popular corretamente

  // Modal de sucesso
  showSuccessModal = false;
  createdOrderNumber = '';
  createdOrderId = '';

  constructor(
    private fb: FormBuilder,
    private ordersService: OrdersService,
    private clientsService: ClientsService,
    private functionalitiesService: FunctionalitiesService,
    private usersService: UsersService,
    private router: Router,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  // data
  clients: Array<{ id: string; name: string }> = [];
  private currentUserId: string | null = null;
  private currentUserName: string | null = null;
  functionalities: Array<{
    id: string;
    name: string;
    minimumPrice: number;
    defaultAssistantPrice?: number;
  }> = [];
  responsibleUsers: Array<{ id: string; name: string }> = [];

  // Must match backend: 'pix' | 'transfer' | 'deposit' | 'card' | 'other'
  paymentMethods = [
    { value: 'pix', label: 'Pix' },
    { value: 'transfer', label: 'Transferência' },
    { value: 'deposit', label: 'Depósito' },
    { value: 'card', label: 'Cartão' },
    { value: 'other', label: 'Outro' },
  ];

  // observables (legacy declarations removed; see top for new ones)

  // form
  form!: FormGroup;

  // build the form structure
  private buildForm() {
    // Note: backend expects lowercase payment method values (e.g., 'pix').
    // Setting default to PIX as requested, mapped to lowercase value 'pix'.
    this.form = this.fb.group({
      clientId: ['', Validators.required],
      contractDate: [this.todayPt(), Validators.required],
      // REGRA: 'PIX' como padrão (mantemos 'pix' minúsculo para contrato backend)
      paymentMethod: ['pix', Validators.required],
      paymentTerms: ['ONE' as PaymentTerms, Validators.required],
      items: this.fb.array([]),
      installments: this.fb.array([]),
    });
    // manter alias solicitado
    this.orderForm = this.form;
  }

  // initial data loader
  private loadInitialData() {
    // REGRA: Carregar Clientes
    this.clients$ = this.clientsService.getClients() as Observable<IClient[]>;
    this.clientsService
      .getClients()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.clients = (list || []).map((c: any) => ({
            id: c.id,
            name:
              c.name || c.fantasyName || c.fullName || c.email || String(c.id),
          }));

          // REGRA: Pré-selecionar o ÚLTIMO cliente adicionado (último da lista)
          if (this.clients.length > 0) {
            const lastClient = this.clients[this.clients.length - 1];
            console.log('🎯 Pré-selecionando último cliente:', lastClient.name);
            this.form.patchValue({ clientId: lastClient.id });
            this.cdr.markForCheck();
          }
        },
      });

    // Carregar Serviços
    this.functionalities$ = this.functionalitiesService.getAll() as Observable<
      IFunctionality[]
    >;
    this.functionalities$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((f) => {
        // keep a simplified array for quick lookup and defaults
        this.functionalities = (f || []).map((it) => ({
          id: it.id,
          name: it.name,
          minimumPrice: it.minimumPrice,
          defaultAssistantPrice: it.defaultAssistantPrice,
          responsibleUserId: (it as any).responsibleUserId,
        }));

        // REGRA: Pré-selecionar a funcionalidade do gerente logado (tenant)
        // Encontrar a funcionalidade onde responsibleUserId === currentUserId
        if (this.currentUserId && this.functionalities.length > 0) {
          const ownFunctionality = this.functionalities.find(
            (func) => (func as any).responsibleUserId === this.currentUserId
          );

          if (ownFunctionality && this.items.length > 0) {
            console.log(
              '🎯 Pré-selecionando funcionalidade própria:',
              ownFunctionality.name
            );
            const firstItem = this.items.at(0) as FormGroup;
            firstItem.patchValue({ functionalityId: ownFunctionality.id });
            // Dispara a lógica de auto-preenchimento
            this.onServiceSelected(ownFunctionality as any, firstItem);
            this.cdr.markForCheck();
          }
        }
      });

    // Carregar Assistentes (para o dropdown de responsáveis)
    // MELHORIA: Idealmente, esta chamada deveria trazer o Dono + Assistentes
    this.assistants$ = this.usersService.getUsers().pipe(
      map((users) =>
        (users || []).map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          isActive: (u as any).isActive ?? true,
          role: ((u as any).role || '') as Role,
          isAdmin: false,
        }))
      )
    );
    // Paliativo: usar assistants$ como responsibleUsers$ por enquanto
    this.responsibleUsers$ = this.assistants$;
    this.assistants$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((users) => {
        const assistants = (users || []).filter((u) => {
          const role = (u.role || '').toString();
          return (
            role === Role.ASSISTANT_REVIEWERS ||
            role.toLowerCase().includes('assistant')
          );
        });
        this.responsibleUsers = assistants.map((u) => ({
          id: u.id,
          name: u.name,
        }));
      });
  }

  ngOnInit(): void {
    // initialize form first
    this.buildForm();

    // get logged user id/name FIRST (before loading data)
    this.auth.getUser().subscribe((u) => {
      this.currentUserId = u?.id || null;
      this.currentUserName = (u as any)?.name || (u as any)?.fullName || null;
      console.log(
        '👤 Usuário logado:',
        this.currentUserName,
        this.currentUserId
      );

      // AGORA que temos o currentUserId, carregamos os dados iniciais
      this.loadInitialData();

      // REGRA: Prazo do cliente (deadline) deve ser 5 dias à frente (Concessão)
      const clientDeadline5Days = this.addDaysPt(this.todayPt(), 5);
      console.log('📅 Prazo cliente (5 dias à frente):', clientDeadline5Days);

      // REGRA: Prazo do assistente deve ser ANTES do prazo do cliente
      // Vamos definir como 3 dias à frente (2 dias antes do prazo do cliente)
      const assistantDeadline3Days = this.addDaysPt(this.todayPt(), 3);
      console.log(
        '📅 Prazo assistente (3 dias à frente):',
        assistantDeadline3Days
      );

      // Adiciona uma linha de item por padrão com os prazos pré-definidos
      this.addItem();

      // Após adicionar o item, define os prazos
      if (this.items.length > 0) {
        const firstItem = this.items.at(0) as FormGroup;
        firstItem.patchValue({
          clientDeadline: clientDeadline5Days,
          deadline: clientDeadline5Days, // Sincronizado com clientDeadline
          assistantDeadline: assistantDeadline3Days, // 2 dias ANTES do cliente
        });
        console.log('✅ Prazos configurados: Assistente < Cliente');
      }
    });

    // recompute installments when total or terms change
    this.items.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.rebuildInstallments());
    this.form
      .get('paymentTerms')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.rebuildInstallments());

    // initial installments build
    this.rebuildInstallments();
  }

  ngOnDestroy(): void {}

  // getters
  get items(): FormArray<FormGroup> {
    return this.form.get('items') as FormArray<FormGroup>;
  }
  // New alias getter as requested
  get itemsFormArray(): FormArray<FormGroup> {
    return this.orderForm.get('items') as FormArray<FormGroup>;
  }
  get installments(): FormArray<FormGroup> {
    return this.form.get('installments') as FormArray<FormGroup>;
  }

  // validation helpers
  invalid(path: string): boolean {
    const c = this.form.get(path);
    return !!c && c.touched && c.invalid;
  }
  invalidItem(index: number, path: string): boolean {
    const c = (this.items.at(index) as FormGroup).get(path);
    return !!c && c.touched && c.invalid;
  }

  // client selection now via <select> bound to formControlName="clientId"

  // date helpers
  onDateChange(control: string, ddmmyyyy: string) {
    this.form.get(control)!.setValue(ddmmyyyy);
  }
  onItemDateChange(index: number, control: string, ddmmyyyy: string) {
    const g = this.items.at(index) as FormGroup;
    g.get(control)!.setValue(ddmmyyyy);
    // If client deadline changed, auto-calc assistant deadline to 3 days before
    if (control === 'clientDeadline' && ddmmyyyy) {
      const currentAssistant = g.get('assistantDeadline')!.value as string;
      const maybe = this.addDaysPt(ddmmyyyy, -3);
      // Set when empty or not before client
      if (!currentAssistant) {
        g.get('assistantDeadline')!.setValue(maybe);
      } else {
        // ensure assistant < client; if not, adjust
        const [ad, am, ay] = (currentAssistant || '').split('/').map(Number);
        const [cd, cm, cy] = (ddmmyyyy || '').split('/').map(Number);
        const aDate = new Date(ay || 0, (am || 1) - 1, ad || 1).getTime();
        const cDate = new Date(cy || 0, (cm || 1) - 1, cd || 1).getTime();
        if (aDate >= cDate) g.get('assistantDeadline')!.setValue(maybe);
      }
    }
    // re-evaluate item-level validators when dates change
    g.updateValueAndValidity();
  }
  onInstallmentDateChange(index: number, ddmmyyyy: string) {
    this.installments.at(index).get('dueDate')!.setValue(ddmmyyyy);
  }

  // item handlers
  addItem() {
    // New fields per command
    const itemFormGroup = this.fb.group(
      {
        functionalityId: ['', Validators.required],
        // 'responsibleId' começa habilitado por padrão
        responsibleId: [null as string | null, Validators.required],
        // new generic deadline for item
        deadline: ['', Validators.required],
        // 'value' é o Preço (minimumPrice do backend)
        value: [0, [Validators.required, Validators.min(0.01)]],
        // 'assistantValue' é o Valor Assistente (defaultAssistantPrice do backend)
        assistantValue: [0],

        // Legacy fields kept for current template/logic compatibility
        price: ['', [Validators.required]],
        clientDeadline: ['', Validators.required],
        responsibleUserId: [null as string | null],
        assistantDeadline: [''],
        assistantAmount: [''],
      },
      { validators: [this.itemDeadlineValidator] }
    );

    // Synchronize new fields with legacy ones (bi-directional, suppress loops)
    // value <-> price
    itemFormGroup.get('value')!.valueChanges.subscribe((v) => {
      const formatted = this.formatPtBR(Number(v || 0));
      if (itemFormGroup.get('price')!.value !== formatted) {
        itemFormGroup.get('price')!.setValue(formatted, { emitEvent: false });
      }
    });
    itemFormGroup.get('price')!.valueChanges.subscribe((v) => {
      const parsed = this.parseMoney(v) || 0;
      if (itemFormGroup.get('value')!.value !== parsed) {
        itemFormGroup.get('value')!.setValue(parsed, { emitEvent: false });
      }
    });

    // assistantValue <-> assistantAmount
    itemFormGroup.get('assistantValue')!.valueChanges.subscribe((v) => {
      const formatted = this.formatPtBR(Number(v || 0));
      if (itemFormGroup.get('assistantAmount')!.value !== formatted) {
        itemFormGroup
          .get('assistantAmount')!
          .setValue(formatted, { emitEvent: false });
      }
    });
    itemFormGroup.get('assistantAmount')!.valueChanges.subscribe((v) => {
      const parsed = this.parseMoney(v) || 0;
      if (itemFormGroup.get('assistantValue')!.value !== parsed) {
        itemFormGroup
          .get('assistantValue')!
          .setValue(parsed, { emitEvent: false });
      }
    });

    // deadline <-> clientDeadline
    itemFormGroup.get('deadline')!.valueChanges.subscribe((v) => {
      if (itemFormGroup.get('clientDeadline')!.value !== v) {
        itemFormGroup.get('clientDeadline')!.setValue(v, { emitEvent: false });
      }
    });
    itemFormGroup.get('clientDeadline')!.valueChanges.subscribe((v) => {
      if (itemFormGroup.get('deadline')!.value !== v) {
        itemFormGroup.get('deadline')!.setValue(v, { emitEvent: false });
      }
    });

    // responsibleId <-> responsibleUserId
    itemFormGroup.get('responsibleId')!.valueChanges.subscribe((v) => {
      if (itemFormGroup.get('responsibleUserId')!.value !== v) {
        itemFormGroup
          .get('responsibleUserId')!
          .setValue(v, { emitEvent: false });
      }
    });
    itemFormGroup.get('responsibleUserId')!.valueChanges.subscribe((v) => {
      if (itemFormGroup.get('responsibleId')!.value !== v) {
        itemFormGroup.get('responsibleId')!.setValue(v, { emitEvent: false });
      }
    });

    // Push into the array using the new alias getter
    this.itemsFormArray.push(itemFormGroup);
  }
  removeItem(i: number) {
    this.items.removeAt(i);
    this.rebuildInstallments();
  }
  onFunctionalitySelected(index: number) {
    const g = this.items.at(index) as FormGroup;
    const fid = g.get('functionalityId')!.value as string;
    const func = this.functionalities.find((f) => f.id === fid);
    if (func) {
      this.onServiceSelected(func as any, g);
    }
  }

  /**
   * Disparado quando um "Serviço" (Functionality) é selecionado.
   * Preenche automaticamente o Responsável, Preço e Valor Assistente.
   */
  onServiceSelected(
    selectedService: IFunctionality,
    itemFormGroup: AbstractControl
  ): void {
    const item = itemFormGroup as FormGroup;
    if (!selectedService || !item) return;

    // 1. Dados do serviço vindos da API
    const responsibleId = (selectedService as any).responsibleUserId as
      | string
      | undefined;
    const price = selectedService.minimumPrice || 0;
    const defaultAssistantPrice =
      (selectedService as any).defaultAssistantPrice || 0;

    // 2. REGRA: Se o responsável é o próprio gerente logado (dono),
    //    o valor do assistente deve ser 0 (não há repasse)
    const isOwner = responsibleId === this.currentUserId;
    const assistantValue = isOwner ? 0 : defaultAssistantPrice;

    console.log('🔧 onServiceSelected:', {
      funcName: selectedService.name,
      responsibleId,
      isOwner,
      price,
      assistantValue,
    });

    // 3. Pré-preenche campos do formulário usando os novos nomes
    item.patchValue(
      {
        responsibleId: responsibleId ?? null,
        value: price,
        assistantValue: assistantValue,
      },
      { emitEvent: true }
    );

    // Sincroniza também os campos legados para compatibilidade imediata
    if (responsibleId != null) {
      item.get('responsibleUserId')?.setValue(responsibleId, {
        emitEvent: false,
      });
    }
    item.get('price')?.setValue(this.formatPtBR(price), { emitEvent: false });
    item
      .get('assistantAmount')
      ?.setValue(this.formatPtBR(assistantValue), { emitEvent: false });

    // 4. REGRA: Trava o campo "Responsável"
    item.get('responsibleId')?.disable({ emitEvent: false });
    // travar também o campo legado exibido no template atual
    item.get('responsibleUserId')?.disable({ emitEvent: false });
  }

  // money formatting/parsing
  onMoneyFocus(index: number, control: string) {
    const g = this.items.at(index) as FormGroup;
    const v = g.get(control)!.value;
    const n = this.parseMoney(v);
    g.get(control)!.setValue(n ? String(n).replace('.', ',') : '');
  }
  onMoneyBlur(index: number, control: string) {
    const g = this.items.at(index) as FormGroup;
    const v = g.get(control)!.value;
    const n = this.parseMoney(v);
    g.get(control)!.setValue(this.formatPtBR(n || 0));
    this.rebuildInstallments();
  }

  onInstallmentFocus(idx: number) {
    const c = this.installments.at(idx).get('amount')!;
    const n = this.parseMoney(c.value);
    c.setValue(n ? String(n).replace('.', ',') : '');
  }
  onInstallmentBlur(idx: number) {
    const c = this.installments.at(idx).get('amount')!;
    const n = this.parseMoney(c.value) || 0;
    c.setValue(this.formatPtBR(n));
    this.redistributeInstallments(idx, n);
  }

  // totals and installments
  get amountTotal(): number {
    const prices = this.items.controls.map(
      (g) => this.parseMoney((g as FormGroup).get('price')!.value) || 0
    );
    return this.round2(prices.reduce((a, b) => a + b, 0));
  }

  rebuildInstallments() {
    const total = this.amountTotal;
    const n = this.paymentTermsToN(
      this.form.get('paymentTerms')!.value as PaymentTerms
    );
    // adjust form array length
    while (this.installments.length > n)
      this.installments.removeAt(this.installments.length - 1);
    while (this.installments.length < n)
      this.installments.push(this.fb.group({ amount: [''], dueDate: [''] }));
    // distribute amounts
    const base = this.round2(total / n);
    const amounts = Array(n).fill(base);
    const residue = this.round2(total - this.round2(base * n));
    amounts[n - 1] = this.round2(amounts[n - 1] + residue);
    for (let i = 0; i < n; i++) {
      this.installments
        .at(i)
        .get('amount')!
        .setValue(this.formatPtBR(amounts[i]));
      const cd = this.form.get('contractDate')!.value as string;
      this.installments
        .at(i)
        .get('dueDate')!
        .setValue(this.addDaysPt(cd, 30 * i));
    }
  }

  redistributeInstallments(editedIndex: number, editedAmount: number) {
    const total = this.amountTotal;
    const n = this.installments.length;
    // sum of others new should be total - edited
    const remaining = this.round2(total - editedAmount);
    const others = [] as number[];
    const shareCount = n - 1;
    const base = this.round2(remaining / shareCount);
    for (let i = 0; i < n; i++) {
      if (i === editedIndex) continue;
      others.push(base);
    }
    const sumOthers = this.round2(others.reduce((a, b) => a + b, 0));
    const residue = this.round2(remaining - sumOthers);
    // apply amounts; residue on last non-edited
    let oi = 0;
    for (let i = 0; i < n; i++) {
      if (i === editedIndex) continue;
      const val =
        oi === others.length - 1
          ? this.round2(others[oi] + residue)
          : others[oi];
      this.installments.at(i).get('amount')!.setValue(this.formatPtBR(val));
      oi++;
    }
    // ensure edited amount formatted too
    this.installments
      .at(editedIndex)
      .get('amount')!
      .setValue(this.formatPtBR(editedAmount));
  }

  // submit
  onSubmit() {
    console.log('🔍 onSubmit chamado');
    console.log('📝 orderForm.invalid:', this.orderForm.invalid);
    console.log('📝 items.length:', this.items.length);
    console.log('📝 orderForm value:', this.orderForm.value);
    console.log('📝 orderForm errors:', this.orderForm.errors);

    // Usar orderForm (alias de form) para validação e para ler valores desabilitados
    if (this.orderForm.invalid || this.items.length === 0) {
      console.error('❌ Form inválido ou sem itens');

      // Marca todos os campos como touched para mostrar erros visuais
      this.orderForm.markAllAsTouched();
      this.items.controls.forEach((item) => item.markAllAsTouched());

      // Exibe tooltip de erro no topo
      this.toastService.error(
        '❌ Formulário inválido. Verifique os campos marcados em vermelho.'
      );
      this.cdr.markForCheck();
      return;
    }

    console.log('✅ Validação inicial passou, obtendo valores...');
    // .getRawValue() pega os valores de campos desabilitados (como 'responsibleId')
    const formData = this.orderForm.getRawValue() as any;
    console.log('📦 formData:', formData);

    // --- REGRA CORRIGIDA: Prazo do assistente deve ser < prazo do cliente do item ---
    for (let idx = 0; idx < (formData.items || []).length; idx++) {
      const it = formData.items[idx] || {};

      // Validar que ambos os prazos existem
      if (!it.assistantDeadline) {
        this.toastService.error(
          `⚠️ Item #${idx + 1}: Prazo do Assistente é obrigatório.`
        );
        // Marca o campo específico
        const itemForm = this.items.at(idx) as FormGroup;
        itemForm.get('assistantDeadline')?.markAsTouched();
        itemForm.get('assistantDeadline')?.setErrors({ required: true });
        this.cdr.markForCheck();
        return;
      }
      if (!it.clientDeadline) {
        this.toastService.error(
          `⚠️ Item #${idx + 1}: Prazo do Cliente é obrigatório.`
        );
        // Marca o campo específico
        const itemForm = this.items.at(idx) as FormGroup;
        itemForm.get('clientDeadline')?.markAsTouched();
        itemForm.get('clientDeadline')?.setErrors({ required: true });
        this.cdr.markForCheck();
        return;
      }

      // Comparar prazo do assistente com prazo do cliente do item
      const [ad, am, ay] = String(it.assistantDeadline)
        .split('/')
        .map((s: string) => Number(s));
      const [cd, cm, cy] = String(it.clientDeadline)
        .split('/')
        .map((s: string) => Number(s));

      const assistantDate = new Date(ay || 0, (am || 1) - 1, ad || 1).getTime();
      const clientDate = new Date(cy || 0, (cm || 1) - 1, cd || 1).getTime();

      if (assistantDate >= clientDate) {
        this.toastService.error(
          `⚠️ Item #${idx + 1}: O Prazo do Assistente (${
            it.assistantDeadline
          }) deve ser anterior ao Prazo do Cliente (${it.clientDeadline}).`
        );
        // Marca ambos os campos em vermelho
        const itemForm = this.items.at(idx) as FormGroup;
        itemForm.get('assistantDeadline')?.markAsTouched();
        itemForm.get('clientDeadline')?.markAsTouched();
        itemForm.get('assistantDeadline')?.setErrors({ invalidDate: true });
        this.cdr.markForCheck();
        return;
      }
    }
    // --- Fim da Validação ---

    console.log('✅ Todas validações passaram, criando DTO...');
    const payload: CreateOrderDto = this.toDto();
    console.log('📤 Payload para enviar:', payload);

    console.log('🚀 Chamando ordersService.create...');
    this.ordersService.create(payload).subscribe({
      next: (res: OrderResponseDto) => {
        console.log('✅ Ordem criada com sucesso:', res);

        // Exibe modal de sucesso com o número da ordem
        this.createdOrderNumber = res.orderNumber || res.id;
        this.createdOrderId = res.id;
        this.showSuccessModal = true;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Erro ao criar ordem:', err);
        const errorMsg = err?.error?.message || 'Falha ao criar a ordem';
        this.toastService.error(`❌ ${errorMsg}`);
      },
    });
  }

  // Método para fechar modal e redirecionar
  onSuccessModalClose(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/orders']);
  }

  resetForm() {
    this.form.reset({
      clientId: '',
      contractDate: this.todayPt(),
      paymentMethod: '',
      paymentTerms: 'ONE',
    });
    this.items.clear();
    this.installments.clear();
    this.addItem();
    this.rebuildInstallments();
  }

  // mapping
  toDto(): CreateOrderDto {
    const paymentMethod = this.form.get('paymentMethod')!.value as string;
    const dto: CreateOrderDto & { paymentMethod?: string } = {
      clientId: this.form.get('clientId')!.value,
      contractDate: this.toIso(this.form.get('contractDate')!.value),
      paymentTerms: this.form.get('paymentTerms')!.value as PaymentTerms,
      items: this.items.controls.map((g, idx) => {
        const fg = g as FormGroup;
        const fidVal = fg.get('functionalityId')!.value as any;
        const functionalityId =
          typeof fidVal === 'string' ? fidVal : fidVal?.id;
        const item: CreateOrderItemDto = {
          functionalityId: functionalityId,
          price: this.parseMoney(fg.get('price')!.value) || 0,
          clientDeadline: this.toIso(fg.get('clientDeadline')!.value),
        };
        const rid = fg.get('responsibleUserId')!.value;
        if (rid) item.responsibleUserId = rid;
        const ad = fg.get('assistantDeadline')!.value;
        if (ad) item.assistantDeadline = this.toIso(ad);
        // Do not send amountForAssistant; backend rejects this property currently
        return item;
      }),
    };
    // Send paymentMethod at order-level (backend expects it here)
    if (paymentMethod) dto.paymentMethod = paymentMethod;
    return dto;
  }

  // utils
  todayPt(): string {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  toIso(ddmmyyyy: string): string {
    if (!ddmmyyyy) return '';
    const [dd, mm, yyyy] = ddmmyyyy.split('/').map((s) => Number(s));
    return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(
      2,
      '0'
    )}`;
  }
  addDaysPt(ddmmyyyy: string, days: number): string {
    const [dd, mm, yyyy] = ddmmyyyy.split('/').map((s) => Number(s));
    const d = new Date(yyyy, (mm || 1) - 1, dd || 1);
    d.setDate(d.getDate() + days);
    const rdd = String(d.getDate()).padStart(2, '0');
    const rmm = String(d.getMonth() + 1).padStart(2, '0');
    const ryyyy = d.getFullYear();
    return `${rdd}/${rmm}/${ryyyy}`;
  }
  paymentTermsToN(pt: PaymentTerms): number {
    return pt === 'THREE' ? 3 : pt === 'TWO' ? 2 : 1;
  }
  round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }
  formatPtBR(n: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(n);
  }
  parseMoney(v: any): number | null {
    if (v == null) return null;
    if (typeof v === 'number') return v;
    let s = String(v).trim();
    if (!s) return null;
    // remove currency symbols and spaces
    s = s.replace(/[^0-9,.-]/g, '');
    // if has comma as decimal
    if (s.includes(',') && s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/[.]/g, '');
      s = s.replace(',', '.');
    }
    const n = Number(s);
    return isNaN(n) ? null : this.round2(n);
  }

  // template helper for responsible name
  getResponsibleName(id?: string | null): string {
    if (!id) return '';
    const found = this.responsibleUsers.find((u) => u.id === id)?.name;
    if (found) return found;
    if (this.currentUserId && id === this.currentUserId) {
      return this.currentUserName || 'Você';
    }
    return '';
  }

  // item-level validator: assistantDeadline must be before clientDeadline when provided
  itemDeadlineValidator = (ctrl: AbstractControl) => {
    const group = ctrl as FormGroup;
    const clientD = group.get('clientDeadline')?.value as string;
    const assistantD = group.get('assistantDeadline')?.value as string;
    if (assistantD && clientD) {
      const [ad, am, ay] = (assistantD || '').split('/').map(Number);
      const [cd, cm, cy] = (clientD || '').split('/').map(Number);
      const aDate = new Date(ay || 0, (am || 1) - 1, ad || 1).getTime();
      const cDate = new Date(cy || 0, (cm || 1) - 1, cd || 1).getTime();
      if (aDate >= cDate) return { assistantAfterClient: true };
    }
    return null;
  };

  hasItemDeadlineError(index: number): boolean {
    const g = this.items.at(index) as FormGroup;
    return !!g && g.hasError('assistantAfterClient') && (g.touched || g.dirty);
  }
}
