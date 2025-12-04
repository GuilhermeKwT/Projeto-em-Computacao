import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Like, ToggleLikeRequest, LikeStatusResponse, LikeCountsResponse } from '../models/like.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LikeService {
  private apiUrl = `${environment.apiUrl}/likes`;

  constructor(private http: HttpClient) {}

  toggleLike(videoId: string, type: 'like' | 'dislike'): Observable<Like> {
    const data: ToggleLikeRequest = { type };
    return this.http.post<Like>(`${this.apiUrl}/${videoId}`, data);
  }

  removeLike(videoId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${videoId}`);
  }

  getUserLikeStatus(videoId: string): Observable<LikeStatusResponse> {
    return this.http.get<LikeStatusResponse>(`${this.apiUrl}/${videoId}/status`);
  }

  getVideoLikeCounts(videoId: string): Observable<LikeCountsResponse> {
    return this.http.get<LikeCountsResponse>(`${this.apiUrl}/${videoId}/counts`);
  }
}
