import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../app/core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true, // Marcando como standalone
  imports: [ReactiveFormsModule, FormsModule], // Importando os módulos necessários
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {}

  login() {
    const { email, password } = this.loginForm.value;
    this.authService.login(email!, password!).subscribe(() => {
      this.router.navigate(['/home']);
    });
  }
}
