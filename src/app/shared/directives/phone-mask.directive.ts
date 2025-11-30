import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

// Máscara brasileira: (99) 99999-9999 — permite apenas dígitos e formata conforme digita
@Directive({
  selector: '[appPhoneMask]',
  standalone: true,
})
export class PhoneMaskDirective {
  private readonly maxDigits = 11;

  constructor(private ngControl: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const onlyDigits = (input.value || '')
      .replace(/\D+/g, '')
      .slice(0, this.maxDigits);

    const formatted = this.formatBRPhone(onlyDigits);
    input.value = formatted;
    // Atualiza o form control com o valor mascarado
    this.ngControl.control?.setValue(formatted, { emitEvent: true });
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    // Permite teclas de controle
    const allowed = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
    ];
    if (allowed.includes(e.key)) return;

    // Bloqueia qualquer coisa que não seja dígito
    if (!/\d/.test(e.key)) {
      e.preventDefault();
    }
  }

  private formatBRPhone(digits: string): string {
    // 10 dígitos -> (99) 9999-9999
    // 11 dígitos -> (99) 99999-9999
    const d = digits;
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10)
      return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
  }
}
