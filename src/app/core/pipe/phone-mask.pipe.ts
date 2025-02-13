import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'phoneMask',
  standalone: true // Sem necessidade de um módulo
})
export class PhoneMaskPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return 'Não informado';

    const cleaned = value.replace(/\D/g, ''); // Remove não numéricos

    if (cleaned.length === 11) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6, 10)}`;
    }

    return value;
  }
}
