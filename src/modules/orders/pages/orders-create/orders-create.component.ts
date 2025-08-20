import {
  ChangeDetectionStrategy,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./orders-create.component.scss'],
  templateUrl: './orders-create.component.html',
})
export class OrdersCreateComponent implements OnInit, OnDestroy {
  // services
  private orders = inject(OrdersService);
  private clientsSvc = inject(ClientsService);
  private funcsSvc = inject(FunctionalitiesService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private auth = inject(AuthService);

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

  form: FormGroup = this.fb.group({
    clientId: ['', Validators.required],
    contractDate: [this.todayPt(), Validators.required],
    paymentMethod: ['', Validators.required],
    paymentTerms: ['ONE' as PaymentTerms, Validators.required],
    items: this.fb.array([]),
    installments: this.fb.array([]),
  });

  ngOnInit(): void {
    // load initial data
    // get logged user id/name
    this.auth.getUser().subscribe((u) => {
      this.currentUserId = u?.id || null;
      this.currentUserName = (u as any)?.name || (u as any)?.fullName || null;
    });

    this.clientsSvc
      .getClients()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) =>
          (this.clients = (list || []).map((c: any) => ({
            id: c.id,
            name:
              c.name || c.fantasyName || c.fullName || c.email || String(c.id),
          }))),
      });
    this.funcsSvc
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (f) => (this.functionalities = f) });
    this.funcsSvc
      .getResponsibleUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (u) => (this.responsibleUsers = u) });

    // default one item
    this.addItem();

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
    const g = this.fb.group(
      {
        functionalityId: ['', Validators.required],
        price: ['', [Validators.required]],
        clientDeadline: ['', Validators.required],
        responsibleUserId: [null as string | null],
        assistantDeadline: [''],
        assistantAmount: [''],
      },
      { validators: [this.itemDeadlineValidator] }
    );
    this.items.push(g);
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
      g.get('price')!.setValue(this.formatPtBR(func.minimumPrice));
      if (func.defaultAssistantPrice != null) {
        g.get('assistantAmount')!.setValue(
          this.formatPtBR(func.defaultAssistantPrice)
        );
      }
      // default or require responsible user based on functionality config
      const resp = (func as any).responsibleUserId as string | undefined;
      const responsibleCtrl = g.get('responsibleUserId')!;
      if (resp) {
        responsibleCtrl.setValue(resp);
        // lock when functionality enforces a single responsible
        if (responsibleCtrl.enabled)
          responsibleCtrl.disable({ emitEvent: false });
        responsibleCtrl.clearValidators();
        responsibleCtrl.updateValueAndValidity({ emitEvent: false });
      } else {
        if (responsibleCtrl.disabled)
          responsibleCtrl.enable({ emitEvent: false });
        responsibleCtrl.setValidators([Validators.required]);
        responsibleCtrl.updateValueAndValidity();
      }
      // If responsible is current user, keep assistant amount as is (already set)
      // No extra action needed; ensure we do not clear assistant amount elsewhere.
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
    if (this.form.invalid || this.items.length === 0) {
      this.form.markAllAsTouched();
      return;
    }
    const payload: CreateOrderDto = this.toDto();
    this.orders.create(payload).subscribe({
      next: (res: OrderResponseDto) => {
        this.toast.success('Ordem criada com sucesso');
        this.router.navigate(['/orders', res.id]);
      },
      error: () => this.toast.error('Falha ao criar a ordem'),
    });
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
        const item: CreateOrderItemDto = {
          functionalityId: fg.get('functionalityId')!.value,
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
