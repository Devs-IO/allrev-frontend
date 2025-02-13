import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../core/interfaces/user-profile.interface';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterModule, CommonModule, HttpClientModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  
  user: UserProfile = {
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    photo: '',
    role: '',
    isActive: false,
    createdAt: new Date(),
    tenantId: '',
    tenantCompanyName: '',
    tenantCode: '',
    tenantPaymentStatus: '',
    tenantPaymentMethod: '',
    tenantPaymentFrequency: '',
    tenantPaymentDueDate: ''
  };

  ngOnInit() {
    this.authService.getUserProfile().subscribe(userData => {
      this.user = { ...userData };
    });
  }

  editProfile() {
    alert('Função de edição ainda não implementada.');
  }

  calculateDaysToDue(dueDate: string | Date): number {
    if (!dueDate) return 0;
  
    const today = new Date();
    const due = new Date(dueDate);
    
    // Diferença em milissegundos
    const diff = due.getTime() - today.getTime();
    
    // Converter para dias
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
