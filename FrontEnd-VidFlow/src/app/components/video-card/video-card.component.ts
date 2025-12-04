import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VideoWithOwner } from '../../models/video.model';
import { VideoService } from '../../services/video.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-video-card',
  templateUrl: './video-card.component.html',
  styleUrls: ['./video-card.component.scss']
})
export class VideoCardComponent implements OnInit {
  @Input() video!: VideoWithOwner;
  thumbnailUrl: string = '';
  isLoadingThumbnail: boolean = true;

  constructor(
    private router: Router,
    private videoService: VideoService
  ) {}

  ngOnInit(): void {
    this.generateThumbnail();
  }

  generateThumbnail(): void {
    if (this.video.thumbnailUrl) {
      this.thumbnailUrl = this.video.thumbnailUrl;
      this.isLoadingThumbnail = false;
      return;
    }
    this.videoService.getStreamUrl(this.video.id).subscribe({
      next: ({ url }) => {
        const videoEl = document.createElement('video');
        videoEl.crossOrigin = 'anonymous';
        videoEl.preload = 'metadata';
        videoEl.muted = true;

        videoEl.onloadeddata = () => {
          videoEl.currentTime = 0.1;
        };

        videoEl.onseeked = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = videoEl.videoWidth || 320;
            canvas.height = videoEl.videoHeight || 180;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
              this.thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
              this.video.thumbnailUrl = this.thumbnailUrl;
            }
          } catch (error) {
            console.warn('Erro ao gerar thumbnail:', error);
            this.thumbnailUrl = 'assets/default-thumbnail.jpg';
          } finally {
            this.isLoadingThumbnail = false;
            videoEl.remove();
          }
        };

        videoEl.onerror = () => {
          console.warn('Erro ao carregar vídeo para thumbnail');
          this.thumbnailUrl = 'assets/default-thumbnail.jpg';
          this.isLoadingThumbnail = false;
          videoEl.remove();
        };

        videoEl.src = url;
      },
      error: (err) => {
        console.warn('Falha ao obter URL de stream para thumbnail', err);
        this.thumbnailUrl = 'assets/default-thumbnail.jpg';
        this.isLoadingThumbnail = false;
      }
    });
  }

  navigateToVideo(): void {
    this.router.navigate(['/video', this.video.id]);
  }

  navigateToChannel(userId: string): void {
    this.router.navigate(['/channel', userId]);
  }

  formatDuration(seconds?: number): string {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  formatViewCount(count?: number): string {
    if (!count && count !== 0) return '0';
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }

  formatDate(dateString?: string | Date): string {
    if (!dateString) return 'Data desconhecida';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data inválida';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
    return `${Math.floor(diffDays / 365)} anos atrás`;
  }

  get uploaderName(): string {
    const anyVideo = this.video as any;
    return (
      this.video.owner?.name ||
      anyVideo.uploaderName ||
      anyVideo.ownerName ||
      anyVideo.userName ||
      anyVideo.channelName ||
      'Usuário'
    );
  }

  get uploaderPhotoUrl(): string | null {
    const anyVideo = this.video as any;
    const photoPath = this.video.owner?.photoUrl || anyVideo.uploaderPhotoUrl || anyVideo.ownerPhotoUrl || anyVideo.userPhotoUrl || null;
    if (!photoPath || photoPath.trim().length === 0) {
      return null;
    }
    if (photoPath.startsWith('http')) {
      return photoPath;
    }
    return `${environment.imageBaseUrl}${photoPath}`;
  }

  get videoDate(): string | Date {
    return this.video.date;
  }

  get duration(): number | undefined {
    return this.video.videoLength;
  }
}
