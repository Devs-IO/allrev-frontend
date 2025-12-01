import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  success(message: string) {
    console.info('[SUCCESS]', message);
  }

  error(message: string) {
    console.error('[ERROR]', message);
  }

  warning(message: string) {
    console.warn('[WARNING]', message);
  }
}
