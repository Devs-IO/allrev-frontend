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
  ValidationErrors,
  ValidatorFn,
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

  // CORREÇÃO: Renomeado de 'assistants$' para 'users$' para clareza
  users$!: Observable<IUser[]>;
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
    responsibleUserId?: string; // Adicionado para 'ownFunctionality'
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

  // form
  form!: FormGroup;

  // build the form structure
  private buildForm() {
    this.form = this.fb.group({
      clientId: [null, Validators.required],
      contractDate: [this.todayPt(), Validators.required],
      paymentMethod: ['pix', Validators.required],
      paymentTerms: ['ONE' as PaymentTerms, Validators.required],
      items: this.fb.array([], Validators.minLength(1)), // Pelo menos 1 item
      installments: this.fb.array([]),
    });
    this.orderForm = this.form;
  }

  // initial data loader
  private loadInitialData() {
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

          if (this.clients.length > 0) {
            const lastClient = this.clients[this.clients.length - 1];
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
        this.functionalities = (f || []).map((it) => ({
          id: it.id,
          name: it.name,
          minimumPrice: it.minimumPrice,
          defaultAssistantPrice: it.defaultAssistantPrice,
          responsibleUserId: (it as any).responsibleUserId,
        }));

        if (this.currentUserId && this.functionalities.length > 0) {
          const ownFunctionality = this.functionalities.find(
            (func) => (func as any).responsibleUserId === this.currentUserId
          );

          if (ownFunctionality && this.items.length > 0) {
            const firstItem = this.items.at(0) as FormGroup;
            // Usa o ID da funcionalidade, não o objeto
            firstItem.patchValue({ functionalityId: ownFunctionality.id });
            // Dispara a lógica de auto-preenchimento
            this.onServiceSelected(ownFunctionality as any, firstItem);
            this.cdr.markForCheck();
          }
        }
      });

    // CORREÇÃO: Renomeado para 'users$'
    this.users$ = this.usersService.getUsers().pipe(
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
    this.responsibleUsers$ = this.users$;
    this.users$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((users) => {
      // Popula a lista de usuários responsáveis
      this.responsibleUsers = (users || []).map((u) => ({
        id: u.id,
        name: u.name,
      }));
    });
  }

  ngOnInit(): void {
    this.buildForm();

    this.auth.getUser().subscribe((u) => {
      this.currentUserId = u?.id || null;
      this.currentUserName = (u as any)?.name || (u as any)?.fullName || null;

      this.loadInitialData();

      const clientDeadline5Days = this.addDaysPt(this.todayPt(), 5);
      const assistantDeadline3Days = this.addDaysPt(this.todayPt(), 3);

      // Adiciona o primeiro item
      this.addItem();

      if (this.items.length > 0) {
        const firstItem = this.items.at(0) as FormGroup;
        firstItem.patchValue({
          clientDeadline: clientDeadline5Days,
          assistantDeadline: assistantDeadline3Days,
        });
      }
    });

    this.items.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.rebuildInstallments());
    this.form
      .get('paymentTerms')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.rebuildInstallments());

    this.rebuildInstallments();
  }

  ngOnDestroy(): void {}

  // getters
  get items(): FormArray<FormGroup> {
    return this.form.get('items') as FormArray<FormGroup>;
  }
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

  // CORREÇÃO: Renomeado para 'itemInvalid' (para bater com o HTML que forneci)
  itemInvalid(index: number, path: string): boolean {
    const c = (this.items.at(index) as FormGroup).get(path);
    return !!c && c.touched && c.invalid;
  }

  // date helpers
  onDateChange(control: string, ddmmyyyy: string) {
    this.form.get(control)!.setValue(ddmmyyyy);
  }
  onItemDateChange(index: number, control: string, ddmmyyyy: string) {
    const g = this.items.at(index) as FormGroup;
    g.get(control)!.setValue(ddmmyyyy);

    if (control === 'clientDeadline' && ddmmyyyy) {
      const currentAssistant = g.get('assistantDeadline')!.value as string;
      const maybe = this.addDaysPt(ddmmyyyy, -3);
      if (!currentAssistant) {
        g.get('assistantDeadline')!.setValue(maybe);
      } else {
        const aDate = this.parseDate(currentAssistant);
        const cDate = this.parseDate(ddmmyyyy);
        if (aDate >= cDate) g.get('assistantDeadline')!.setValue(maybe);
      }
    }
    g.updateValueAndValidity();
  }
  onInstallmentDateChange(index: number, ddmmyyyy: string) {
    this.installments.at(index).get('dueDate')!.setValue(ddmmyyyy);
  }

  // item handlers
  addItem() {
    // CORREÇÃO: Formulário do item simplificado (sem campos duplicados)
    const itemFormGroup = this.fb.group(
      {
        functionalityId: [null, Validators.required],
        price: ['R$ 0,00', [Validators.required, this.minMoney(0.01)]],
        clientDeadline: ['', Validators.required],
        responsibleUserId: [null as string | null], // Responsável é opcional
        assistantDeadline: ['', Validators.required], // Prazo assistente é obrigatório
        assistantAmount: ['R$ 0,00'],
      },
      { validators: [this.itemDeadlineValidator] }
    );

    this.items.push(itemFormGroup);
  }

  removeItem(i: number) {
    this.items.removeAt(i);
    this.rebuildInstallments();
  }

  // CORREÇÃO: Adicionada função 'onFunctionalityChange' para bater com o HTML
  onFunctionalityChange(index: number, event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const functionalityId = selectElement.value;
    const itemFormGroup = this.items.at(index) as FormGroup;

    const selectedService = this.functionalities.find(
      (f) => f.id === functionalityId
    );

    if (selectedService) {
      this.onServiceSelected(selectedService as IFunctionality, itemFormGroup);
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

    const responsibleId = (selectedService as any).responsibleUserId as
      | string
      | undefined;
    const price = selectedService.minimumPrice || 0;
    const defaultAssistantPrice =
      (selectedService as any).defaultAssistantPrice || 0;

    const isOwner = responsibleId === this.currentUserId;
    const assistantValue = isOwner ? 0 : defaultAssistantPrice;

    // CORREÇÃO: Preenche os campos corretos (sem 'value' ou 'responsibleId')
    item.patchValue(
      {
        responsibleUserId: responsibleId ?? null,
        price: this.formatPtBR(price),
        assistantAmount: this.formatPtBR(assistantValue),
      },
      { emitEvent: true } // Dispara 'valueChanges' para recálculo
    );

    // Trava o campo "Responsável"
    if (responsibleId) {
      item.get('responsibleUserId')?.disable({ emitEvent: false });
    } else {
      item.get('responsibleUserId')?.enable({ emitEvent: false });
    }
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
    // Não precisa chamar rebuildInstallments() aqui, pois o valueChanges do items já faz isso
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
    while (this.installments.length > n)
      this.installments.removeAt(this.installments.length - 1);
    while (this.installments.length < n)
      this.installments.push(this.fb.group({ amount: [''], dueDate: [''] }));

    const base = this.round2(total / n);
    const amounts = Array(n).fill(base);
    const residue = this.round2(total - this.round2(base * n));
    if (n > 0) {
      amounts[n - 1] = this.round2(amounts[n - 1] + residue);
    }

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
    if (n <= 1) {
      // Não redistribui se só há uma parcela
      this.installments
        .at(editedIndex)
        .get('amount')!
        .setValue(this.formatPtBR(total)); // Força o total
      return;
    }

    const remaining = this.round2(total - editedAmount);
    const shareCount = n - 1;
    const base = this.round2(remaining / shareCount);

    const others = [] as number[];
    for (let i = 0; i < n; i++) {
      if (i === editedIndex) continue;
      others.push(base);
    }

    const sumOthers = this.round2(others.reduce((a, b) => a + b, 0));
    const residue = this.round2(remaining - sumOthers);

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
    this.installments
      .at(editedIndex)
      .get('amount')!
      .setValue(this.formatPtBR(editedAmount));
  }

  // submit
  onSubmit() {
    // Usa orderForm (alias de form) para validação e para ler valores desabilitados
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      this.items.controls.forEach((item) => item.markAllAsTouched());
      this.toastService.error(
        '❌ Formulário inválido. Verifique os campos marcados em vermelho.'
      );
      this.cdr.markForCheck();
      return;
    }

    const formData = this.orderForm.getRawValue() as any;

    // --- Validação de Prazos ---
    for (let idx = 0; idx < (formData.items || []).length; idx++) {
      const it = formData.items[idx] || {};

      if (!it.assistantDeadline) {
        this.toastService.error(
          `⚠️ Item #${idx + 1}: Prazo do Assistente é obrigatório.`
        );
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
        const itemForm = this.items.at(idx) as FormGroup;
        itemForm.get('clientDeadline')?.markAsTouched();
        itemForm.get('clientDeadline')?.setErrors({ required: true });
        this.cdr.markForCheck();
        return;
      }

      const assistantDate = this.parseDate(it.assistantDeadline);
      const clientDate = this.parseDate(it.clientDeadline);

      if (assistantDate >= clientDate) {
        this.toastService.error(
          `⚠️ Item #${idx + 1}: O Prazo do Assistente (${
            it.assistantDeadline
          }) deve ser anterior ao Prazo do Cliente (${it.clientDeadline}).`
        );
        const itemForm = this.items.at(idx) as FormGroup;
        itemForm.get('assistantDeadline')?.markAsTouched();
        itemForm.get('clientDeadline')?.markAsTouched();
        itemForm.get('assistantDeadline')?.setErrors({ invalidDate: true });
        this.cdr.markForCheck();
        return;
      }
    }
    // --- Fim da Validação ---

    const payload: CreateOrderDto = this.toDto();

    this.ordersService.create(payload).subscribe({
      next: (res: OrderResponseDto) => {
        this.createdOrderNumber = res.orderNumber || res.id;
        this.createdOrderId = res.id;
        this.showSuccessModal = true;
        this.cdr.markForCheck();
      },
      error: (err) => {
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
      clientId: null,
      contractDate: this.todayPt(),
      paymentMethod: 'pix',
      paymentTerms: 'ONE',
    });
    this.items.clear();
    this.installments.clear();
    this.addItem(); // Adiciona um item limpo
    this.rebuildInstallments();
  }

  // mapping
  toDto(): CreateOrderDto {
    // Pega o valor "raw" para incluir campos desabilitados (como responsibleUserId)
    const rawForm = this.form.getRawValue();

    const paymentMethod = rawForm.paymentMethod as string;
    const dto: CreateOrderDto & { paymentMethod?: string } = {
      clientId: rawForm.clientId,
      contractDate: this.toIso(rawForm.contractDate),
      paymentTerms: rawForm.paymentTerms as PaymentTerms,
      items: rawForm.items.map((it: any) => {
        const item: CreateOrderItemDto = {
          functionalityId: it.functionalityId, // ID já é string
          price: this.parseMoney(it.price) || 0,
          clientDeadline: this.toIso(it.clientDeadline),
          assistantDeadline: this.toIso(it.assistantDeadline), // Campo obrigatório
          // CORREÇÃO: Adiciona assistantAmount
          assistantAmount: this.parseMoney(it.assistantAmount) || 0,
        };

        // Adiciona responsável apenas se selecionado
        if (it.responsibleUserId) {
          item.responsibleUserId = it.responsibleUserId;
        }

        return item;
      }),
    };
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
  parseDate(ddmmyyyy: string): number {
    const [dd, mm, yyyy] = (ddmmyyyy || '').split('/').map(Number);
    return new Date(yyyy || 0, (mm || 1) - 1, dd || 1).getTime();
  }
  addDaysPt(ddmmyyyy: string, days: number): string {
    const d = new Date(this.parseDate(ddmmyyyy));
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
    s = s.replace(/[^0-9,.-]/g, '');
    if (s.includes(',') && s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/[.]/g, '');
      s = s.replace(',', '.');
    }
    const n = Number(s);
    return isNaN(n) ? null : this.round2(n);
  }

  // Validador de dinheiro
  minMoney(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = this.parseMoney(control.value);
      if (value == null || value < min) {
        return { minMoney: { requiredValue: min, actualValue: value } };
      }
      return null;
    };
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
      const aDate = this.parseDate(assistantD);
      const cDate = this.parseDate(clientD);
      if (aDate >= cDate) return { assistantAfterClient: true };
    }
    return null;
  };

  hasItemDeadlineError(index: number): boolean {
    const g = this.items.at(index) as FormGroup;
    return !!g && g.hasError('assistantAfterClient') && (g.touched || g.dirty);
  }
}
