import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  profileForm: FormGroup;
  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';
  photoPreviewUrl: string | null = null;
  editingFields: Record<string, boolean> = {};
  savingField: Record<string, boolean> = {};
  get displayedPhotoUrl(): string {
    const raw = this.photoPreviewUrl || this.user?.photoUrl || '';
    if (!raw) return 'assets/default-avatar.png';
    if (raw.startsWith('http')) return raw;
    return `https://rgw.ovh:9000/images/${raw}`;
  }

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      name: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(3)]],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm.patchValue({
          name: user.name,
          email: user.email,
          
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile', error);
        this.isLoading = false;
      }
    });
  }

  toggleEdit(field: 'name'|'email') {
    this.editingFields[field] = !this.editingFields[field];
    const control = this.profileForm.get(field);
    if (!control) return;
    if (this.editingFields[field]) {
      control.enable();
    } else {
      control.disable();
    }
  }

  saveField(field: 'name'|'email') {
    const control = this.profileForm.get(field);
    if (!control || control.disabled || !this.user) return;
    this.savingField[field] = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.userService.updateCurrentField(field, control.value).subscribe({
      next: (updated) => {
        this.user = updated;
        this.authService.updateCurrentUser(updated);
        this.profileForm.patchValue({ [field]: (updated as any)[field] });
        this.editingFields[field] = false;
        control.disable();
        this.savingField[field] = false;
        this.successMessage = 'Campo atualizado com sucesso!';
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erro ao salvar campo.';
        this.savingField[field] = false;
      }
    });
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreviewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
    this.uploadPhoto(file);
  }

  uploadPhoto(file: File) {
    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.userService.uploadPhoto(file).subscribe({
      next: (updated) => {
        this.user = updated;
        this.authService.updateCurrentUser(updated);
        this.isSaving = false;
        this.successMessage = 'Foto de perfil atualizada!';
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erro ao atualizar foto.';
        this.isSaving = false;
      }
    });
  }

  goToChangePassword() {
    this.router.navigate(['/profile/password']);
  }

  getErrorMessage(field: string): string {
    const control = this.profileForm.get(field);
    if (control?.hasError('required')) {
      return 'Este campo é obrigatório';
    }
    if (control?.hasError('email')) {
      return 'Email inválido';
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Deve ter pelo menos ${minLength} caracteres`;
    }
    return '';
  }
}
