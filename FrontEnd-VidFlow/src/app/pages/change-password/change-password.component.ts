import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent {
  form: FormGroup;
  isSaving = false;
  successMessage = '';
  errorMessage = '';
  hideCurrent = true;
  hideNew = true;
  hideConfirm = true;

  constructor(private fb: FormBuilder, private userService: UserService, private authService: AuthService) {
    this.form = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  submit() {
    if (this.form.invalid || this.isSaving) return;
    const { currentPassword, newPassword, confirmPassword } = this.form.value;
    if (newPassword !== confirmPassword) {
      this.errorMessage = 'As senhas não coincidem';
      return;
    }
    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.userService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.successMessage = 'Senha alterada com sucesso';
        this.isSaving = false;
        this.form.reset();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erro ao alterar senha';
        this.isSaving = false;
      }
    });
  }
}