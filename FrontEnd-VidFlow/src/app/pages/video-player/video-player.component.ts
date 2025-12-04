import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VideoService } from '../../services/video.service';
import { CommentService } from '../../services/comment.service';
import { LikeService } from '../../services/like.service';
import { AuthService } from '../../services/auth.service';
import { VideoWithOwner } from '../../models/video.model';
import { CommentWithUser } from '../../models/comment.model';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements OnInit {
  video: VideoWithOwner | null = null;
  comments: CommentWithUser[] = [];
  isLoading = true;
  userLikeStatus: 'like' | 'dislike' | 'none' = 'none';
  likesCount = 0;
  dislikesCount = 0;
  commentForm: FormGroup;
  isSubmittingComment = false;
  canEdit = false;
  canDelete = false;
  videoUrl = '';
  editingCommentId: string | null = null;
  editCommentText = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private videoService: VideoService,
    private commentService: CommentService,
    private likeService: LikeService,
    private authService: AuthService
  ) {
    this.commentForm = this.fb.group({
      text: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(5000)]]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const videoId = params['id'];
      if (videoId) {
        this.loadVideo(videoId);
        this.loadComments(videoId);
        this.loadLikeStatus(videoId);
        this.loadLikeCounts(videoId);
      }
    });
  }

  loadVideo(id: string): void {
    this.isLoading = true;
    this.videoService.getVideoById(id).subscribe({
      next: (video) => {
        const userStr = localStorage.getItem('currentUser');
        let currentUserId: string | null = null;
        let isAdmin = false;
        
        if (userStr && userStr !== 'undefined' && userStr !== 'null') {
          try {
            const currentUser = JSON.parse(userStr);
            currentUserId = currentUser?.id || null;
            isAdmin = currentUser?.role === 'admin';
            const isOwner = currentUserId === video.userId;
            this.canEdit = isOwner;
            this.canDelete = isOwner || isAdmin;
          } catch (e) {
            this.canEdit = false;
            this.canDelete = false;
          }
        } else {
          this.canEdit = false;
          this.canDelete = false;
        }
        
        const isOwner = currentUserId === video.userId;
        const canView = video.visibility === 'public' || isOwner || isAdmin;
        
        if (!canView) {
          alert('Este vídeo é privado e você não tem permissão para visualizá-lo.');
          this.isLoading = false;
          this.router.navigate(['/']);
          return;
        }
        
        this.video = video;
        this.isLoading = false;
        
        this.videoService.getStreamUrl(id).subscribe({
          next: (response) => {
            this.videoUrl = response.url;
          },
          error: (error) => {
            console.error('Error loading video URL', error);
          }
        });
      },
      error: (error) => {
        console.error('Error loading video', error);
        this.isLoading = false;
        this.router.navigate(['/']);
      }
    });
  }

  loadComments(videoId: string): void {
    this.commentService.getComments(videoId).subscribe({
      next: (response) => {
        const list = Array.isArray(response) ? response : (response as any)?.comments ?? [];
        this.comments = Array.isArray(list) ? list as any[] : [];
      },
      error: (error) => {
        console.error('Error loading comments', error);
        this.comments = [];
      }
    });
  }

  loadLikeStatus(videoId: string): void {
    if (this.authService.isAuthenticated()) {
      this.likeService.getUserLikeStatus(videoId).subscribe({
        next: (response) => {
          this.userLikeStatus = response.status;
        },
        error: (error) => {
          console.error('Error loading like status', error);
        }
      });
    }
  }

  loadLikeCounts(videoId: string): void {
    this.likeService.getVideoLikeCounts(videoId).subscribe({
      next: (response) => {
        this.likesCount = response.likes;
        this.dislikesCount = response.dislikes;
      },
      error: (error) => {
        console.error('Error loading like counts', error);
      }
    });
  }

  toggleLike(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.video) {
      const newType: 'like' | 'dislike' = this.userLikeStatus === 'like' ? 'dislike' : 'like';
      
      if (this.userLikeStatus === newType) {
        this.likeService.removeLike(this.video.id).subscribe({
          next: () => {
            this.userLikeStatus = 'none';
            this.loadLikeCounts(this.video!.id);
          },
          error: (error) => {
            console.error('Error removing like', error);
          }
        });
      } else {
        this.likeService.toggleLike(this.video.id, 'like').subscribe({
          next: () => {
            this.userLikeStatus = 'like';
            this.loadLikeCounts(this.video!.id);
          },
          error: (error) => {
            console.error('Error toggling like', error);
          }
        });
      }
    }
  }

  toggleDislike(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.video) {
      if (this.userLikeStatus === 'dislike') {
        this.likeService.removeLike(this.video.id).subscribe({
          next: () => {
            this.userLikeStatus = 'none';
            this.loadLikeCounts(this.video!.id);
          },
          error: (error) => {
            console.error('Error removing dislike', error);
          }
        });
      } else {
        this.likeService.toggleLike(this.video.id, 'dislike').subscribe({
          next: () => {
            this.userLikeStatus = 'dislike';
            this.loadLikeCounts(this.video!.id);
          },
          error: (error) => {
            console.error('Error toggling dislike', error);
          }
        });
      }
    }
  }

  submitComment(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.commentForm.valid && this.video && !this.isSubmittingComment) {
      this.isSubmittingComment = true;
      
      const payload = { text: this.commentForm.value.text };
      this.commentService.createComment(this.video.id, payload).subscribe({
        next: (comment) => {
          if (!this.comments) {
            this.comments = [];
          }
          this.comments.unshift(comment);
          this.commentForm.reset();
          this.isSubmittingComment = false;
        },
        error: (error) => {
          console.error('Error submitting comment', error);
          this.isSubmittingComment = false;
        }
      });
    }
  }

  deleteVideo(): void {
    if (this.video && confirm('Tem certeza que deseja excluir este vídeo?')) {
      this.videoService.deleteVideo(this.video.id).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error('Error deleting video', error);
          alert('Erro ao excluir vídeo');
        }
      });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  navigateToChannel(userId: string): void {
    this.router.navigate(['/channel', userId]);
  }

  editVideo(): void {
    if (this.video) {
      this.router.navigate(['/video', this.video.id, 'edit']);
    }
  }

  canDeleteComment(comment: any): boolean {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr || userStr === 'undefined' || userStr === 'null') {
      return false;
    }
    try {
      const currentUser = JSON.parse(userStr);
      const isAdmin = currentUser?.role === 'admin';
      const isOwner = currentUser?.id === comment.userId;
      return isOwner || isAdmin;
    } catch (e) {
      return false;
    }
  }

  canEditComment(comment: any): boolean {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr || userStr === 'undefined' || userStr === 'null') {
      return false;
    }
    try {
      const currentUser = JSON.parse(userStr);
      return currentUser?.id === comment.userId;
    } catch (e) {
      return false;
    }
  }

  deleteComment(commentId: string): void {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) {
      return;
    }

    this.commentService.deleteComment(commentId).subscribe({
      next: () => {
        this.comments = this.comments.filter(c => c.id !== commentId);
      },
      error: (error) => {
        console.error('Error deleting comment', error);
        alert('Erro ao excluir comentário. Tente novamente.');
      }
    });
  }

  startEditComment(comment: any): void {
    this.editingCommentId = comment.id;
    this.editCommentText = comment.text;
  }

  cancelEditComment(): void {
    this.editingCommentId = null;
    this.editCommentText = '';
  }

  saveEditComment(commentId: string): void {
    if (!this.editCommentText.trim()) {
      return;
    }

    this.commentService.updateComment(commentId, { text: this.editCommentText }).subscribe({
      next: (updated) => {
        const index = this.comments.findIndex(c => c.id === commentId);
        if (index !== -1) {
          this.comments[index] = { ...this.comments[index], text: updated.text, date: updated.date };
        }
        this.cancelEditComment();
      },
      error: (error) => {
        console.error('Error updating comment', error);
        alert('Erro ao editar comentário. Tente novamente.');
      }
    });
  }
}
