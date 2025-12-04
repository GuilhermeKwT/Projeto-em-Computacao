import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Video,
  VideoWithOwner,
  InitiateUploadRequest,
  InitiateUploadResponse,
  CompleteUploadRequest,
  CompleteUploadResponse,
  UpdateVideoRequest,
  VideoListResponse 
} from '../models/video.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private apiUrl = `${environment.apiUrl}/videos`;

  constructor(private http: HttpClient) {}

  getVideos(page: number = 1, pageSize: number = 20, search?: string, sortBy?: string, sortOrder?: string): Observable<VideoListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    if (search) {
      params = params.set('q', search);
    }
    if (sortBy) {
      params = params.set('sortBy', sortBy);
    }
    if (sortOrder) {
      params = params.set('sortOrder', sortOrder);
    }

    return this.http.get<VideoListResponse>(this.apiUrl, { params });
  }

  getVideoById(id: string): Observable<VideoWithOwner> {
    return this.http.get<VideoWithOwner>(`${this.apiUrl}/${id}`);
  }

  initiateUpload(data: InitiateUploadRequest): Observable<InitiateUploadResponse> {
    return this.http.post<InitiateUploadResponse>(`${this.apiUrl}/initiate`, data);
  }

  completeUpload(data: CompleteUploadRequest): Observable<CompleteUploadResponse> {
    return this.http.post<CompleteUploadResponse>(`${this.apiUrl}/complete`, data);
  }

  updateVideo(id: string, data: UpdateVideoRequest): Observable<Video> {
    return this.http.put<Video>(`${this.apiUrl}/${id}`, data);
  }

  deleteVideo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  uploadToS3(presignedUrl: string, presignedFields: { [key: string]: string }, file: File): Observable<any> {
    const formData = new FormData();
    
    Object.entries(presignedFields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    if (!presignedFields['Content-Type'] && file.type) {
      formData.append('Content-Type', file.type);
    }
    
    formData.append('file', file);
    
    return this.http.post(presignedUrl, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  getStreamUrl(id: string): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.apiUrl}/${id}/stream`);
  }

  getUserVideos(userId: string, page: number = 1, pageSize: number = 20): Observable<VideoListResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    return this.http.get<VideoListResponse>(`${this.apiUrl}/user/${userId}`, { params });
  }
}
