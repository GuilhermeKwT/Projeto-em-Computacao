import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { VideoService } from '../../services/video.service';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent {
  uploadForm: FormGroup;
  selectedFile: File | null = null;
  uploadProgress = 0;
  isUploading = false;
  uploadCompleted = false;
  errorMessage = '';
  uploadKey: string | null = null;

  constructor(
    private fb: FormBuilder,
    private videoService: VideoService,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.uploadForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(1)]],
      visibility: ['public'],
      file: [null, Validators.required]
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      if (!file.type.startsWith('video/')) {
        this.errorMessage = 'Por favor, selecione um arquivo de vídeo válido';
        return;
      }

      if (file.size > 3 * 1024 * 1024 * 1024) {
        this.errorMessage = 'O arquivo deve ter no máximo 3GB';
        return;
      }

      this.selectedFile = file;
      this.uploadForm.patchValue({ file: file });
      this.errorMessage = '';
    }
  }

  onSubmit(): void {
    if (this.uploadForm.valid && this.selectedFile && !this.isUploading) {
      this.isUploading = true;
      this.uploadProgress = 0;
      this.errorMessage = '';

      const initiateData = {
        title: this.uploadForm.value.title,
        description: this.uploadForm.value.description || '',
        visibility: this.uploadForm.value.visibility || 'public',
        filename: this.selectedFile.name,
        contentType: this.selectedFile.type || 'video/mp4',
        declaredSize: this.selectedFile.size
      };

      this.videoService.initiateUpload(initiateData).subscribe({
        next: (response) => {
          this.uploadKey = response.key;
          this.uploadToS3(response.upload.url, response.upload.fields);
        },
        error: (error) => {
          console.error('Error initiating upload', error);
          this.errorMessage = error.error?.msg || 'Erro ao iniciar upload. Tente novamente.';
          this.isUploading = false;
        }
      });
    }
  }

  private uploadToS3(presignedUrl: string, presignedFields: { [key: string]: string }): void {
    if (!this.selectedFile) return;

    this.videoService.uploadToS3(presignedUrl, presignedFields, this.selectedFile).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          if (event.total) {
            this.uploadProgress = Math.round((100 * event.loaded) / event.total);
          }
        } else if (event.type === HttpEventType.Response) {
          this.completeUpload();
        }
      },
      error: (error) => {
        console.error('Error uploading to S3', error);
        this.errorMessage = 'Erro ao fazer upload do vídeo. Tente novamente.';
        this.isUploading = false;
      }
    });
  }

  private completeUpload(): void {
    if (!this.uploadKey) return;

    const completeData = {
      key: this.uploadKey,
      title: this.uploadForm.value.title,
      description: this.uploadForm.value.description || '',
      visibility: this.uploadForm.value.visibility || 'public',
      videoLength: 0
    };

    this.videoService.completeUpload(completeData).subscribe({
      next: (response) => {
        this.isUploading = false;
        this.uploadCompleted = true;
        
        const dialogRef = this.dialog.open(UploadSuccessDialog, {
          width: '450px',
          disableClose: true
        });
        
        dialogRef.afterClosed().subscribe(() => {
          this.router.navigate(['/']);
        });
      },
      error: (error) => {
        console.error('Error completing upload', error);
        this.errorMessage = error.error?.msg || 'Erro ao finalizar upload. Tente novamente.';
        this.isUploading = false;
      }
    });
  }

  getErrorMessage(field: string): string {
    const control = this.uploadForm.get(field);
    if (control?.hasError('required')) {
      return 'Este campo é obrigatório';
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return field === 'title' ? 'O título deve ter pelo menos 3 caracteres' : `Mínimo ${minLength} caractere(s)`;
    }
    return '';
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

@Component({
  selector: 'upload-success-dialog',
  template: `
    <div class="success-dialog">
      <div class="dialog-header">
        <div class="success-icon">✓</div>
        <h2>Vídeo Enviado com Sucesso!</h2>
      </div>
      <div class="dialog-content">
        <p>Seu vídeo foi enviado para processamento e será publicado em até 24 horas.</p>
      </div>
      <div class="dialog-actions">
        <button mat-raised-button color="primary" (click)="close()">
          OK
        </button>
      </div>
    </div>
  `,
  styles: [`
    .success-dialog {
      text-align: center;
      padding: 24px;
    }
    .dialog-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    .success-icon {
      font-size: 64px;
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #4caf50;
      color: white;
      border-radius: 50%;
      font-weight: bold;
    }
    h2 {
      margin: 0;
      color: #212121;
      font-size: 24px;
    }
    .dialog-content p {
      margin: 12px 0;
      color: #424242;
      line-height: 1.6;
    }
    .dialog-actions {
      margin-top: 24px;
      display: flex;
      justify-content: center;
    }
  `]
})
export class UploadSuccessDialog {
  constructor(private dialogRef: MatDialogRef<UploadSuccessDialog>) {}
  
  close(): void {
    this.dialogRef.close(true);
  }
}
