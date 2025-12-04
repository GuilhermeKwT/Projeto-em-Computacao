import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoService } from '../../services/video.service';
import { Video } from '../../models/video.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-channel',
  templateUrl: './channel.component.html',
  styleUrls: ['./channel.component.scss']
})
export class ChannelComponent implements OnInit {
  userId!: string;
  isLoading = false;
  videos: (Video | any)[] = [];
  channelName = 'Canal';
  channelPhotoUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoService: VideoService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.userId = params['userId'];
      if (!this.userId) {
        this.router.navigate(['/']);
        return;
      }
      this.loadChannelVideos();
    });
  }

  loadChannelVideos(): void {
    this.isLoading = true;
    this.videoService.getUserVideos(this.userId, 1, 100).subscribe({
      next: (response) => {
        const list = Array.isArray(response) ? response : (response as any)?.videos ?? [];
        let allVideos = Array.isArray(list) ? list as any[] : [];
        
        const userStr = localStorage.getItem('currentUser');
        let currentUserId: string | null = null;
        let isAdmin = false;
        if (userStr && userStr !== 'undefined' && userStr !== 'null') {
          try {
            const currentUser = JSON.parse(userStr);
            currentUserId = currentUser?.id || null;
            isAdmin = currentUser?.role === 'admin';
          } catch (e) {
            currentUserId = null;
            isAdmin = false;
          }
        }
        
        if (currentUserId === this.userId || isAdmin) {
          this.videos = allVideos;
        } else {
          this.videos = allVideos.filter((v: any) => v.visibility === 'public');
        }
        
        const first = (allVideos && allVideos.length > 0) ? (allVideos[0] as any) : null;
        if (first) {
          this.channelName = first.uploaderName || first.owner?.name || 'Nome do Canal';
          const photo = first.uploaderPhotoUrl || first.owner?.photoUrl || null;
          const hasPhoto = photo && typeof photo === 'string' && photo.trim().length > 0;
          this.channelPhotoUrl = hasPhoto
            ? (photo.startsWith('http') ? photo : `${environment.imageBaseUrl}${photo}`)
            : null;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading channel videos', err);
        this.isLoading = false;
      }
    });
  }

  navigateToVideo(id: string): void {
    this.router.navigate(['/video', id]);
  }
}
