import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  success(message: string) {
    try {
      console.info('[SUCCESS]', message);
    } catch {
      console.info('[SUCCESS]', message);
    }
  }

  error(message: string) {
    try {
      console.error('[ERROR]', message);
    } catch {
      console.error('[ERROR]', message);
    }
  }
}
