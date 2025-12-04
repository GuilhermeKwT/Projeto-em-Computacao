import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VideoService } from '../../services/video.service';
import { AuthService } from '../../services/auth.service';
import { VideoWithOwner } from '../../models/video.model';

@Component({
  selector: 'app-edit-video',
  templateUrl: './edit-video.component.html',
  styleUrls: ['./edit-video.component.scss']
})
export class EditVideoComponent implements OnInit {
  video: VideoWithOwner | null = null;
  editForm: FormGroup;
  isLoading = true;
  isSaving = false;
  isDeleting = false;
  videoId!: string;

  visibilityOptions = [
    { value: 'public', label: 'Público - Visível para todos' },
    { value: 'link-only', label: 'Não listado - Somente com link' },
    { value: 'hidden', label: 'Privado - Somente você' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private videoService: VideoService,
    private authService: AuthService
  ) {
    this.editForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(1)]],
      description: ['', [Validators.required, Validators.minLength(1)]],
      visibility: ['public', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.videoId = params['id'];
      if (this.videoId) {
        this.loadVideo();
      }
    });
  }

  loadVideo(): void {
    this.isLoading = true;
    this.videoService.getVideoById(this.videoId).subscribe({
      next: (video) => {
        this.video = video;
        
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser || currentUser.id !== video.userId) {
          alert('Você não tem permissão para editar este vídeo');
          this.router.navigate(['/video', this.videoId]);
          return;
        }

        this.editForm.patchValue({
          title: video.title,
          description: video.description,
          visibility: video.visibility
        });

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading video', error);
        alert('Erro ao carregar vídeo');
        this.router.navigate(['/']);
        this.isLoading = false;
      }
    });
  }

  saveChanges(): void {
    if (this.editForm.invalid || !this.video) {
      return;
    }

    this.isSaving = true;
    const updates = this.editForm.value;

    this.videoService.updateVideo(this.videoId, updates).subscribe({
      next: () => {
        alert('Vídeo atualizado com sucesso!');
        this.router.navigate(['/video', this.videoId]);
      },
      error: (error) => {
        console.error('Error updating video', error);
        alert('Erro ao atualizar vídeo. Tente novamente.');
        this.isSaving = false;
      }
    });
  }

  deleteVideo(): void {
    if (!confirm('Tem certeza que deseja excluir este vídeo? Esta ação não pode ser desfeita.')) {
      return;
    }

    this.isDeleting = true;
    this.videoService.deleteVideo(this.videoId).subscribe({
      next: () => {
        alert('Vídeo excluído com sucesso!');
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Error deleting video', error);
        alert('Erro ao excluir vídeo. Tente novamente.');
        this.isDeleting = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/video', this.videoId]);
  }
}
