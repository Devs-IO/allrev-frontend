import { Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import flatpickr from 'flatpickr';
import { Portuguese } from 'flatpickr/dist/l10n/pt';

@Directive({
  selector: '[appBrDatepicker]',
  standalone: true,
})
export class BrDatepickerDirective implements OnInit, OnDestroy {
  @Input() minDate?: string | Date;
  @Input() maxDate?: string | Date;
  @Output() dateChange = new EventEmitter<string>();

  private fp?: flatpickr.Instance;

  constructor(private el: ElementRef<HTMLInputElement>) {}

  ngOnInit(): void {
    this.fp = flatpickr(this.el.nativeElement, {
      dateFormat: 'd/m/Y',
      disableMobile: true,
      allowInput: false,
      locale: Portuguese,
      minDate: this.minDate,
      maxDate: this.maxDate,
    onChange: (selectedDates: Date[]) => {
        const d = selectedDates?.[0];
        if (d) {
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          this.el.nativeElement.value = `${dd}/${mm}/${yyyy}`;
          this.dateChange.emit(`${dd}/${mm}/${yyyy}`);
      // propagate to Angular forms/ngModel
      this.el.nativeElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },
    });
  }

  ngOnDestroy(): void {
    this.fp?.destroy();
  }
}
