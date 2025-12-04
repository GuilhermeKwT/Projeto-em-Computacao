import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comment, CommentWithUser, CreateCommentRequest } from '../models/comment.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = `${environment.apiUrl}/comments`;

  constructor(private http: HttpClient) {}

  getComments(videoId: string, page: number = 1, pageSize: number = 20, sortOrder: string = 'desc'): Observable<CommentWithUser[] | Comment[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('sortOrder', sortOrder);

    return this.http.get<CommentWithUser[] | Comment[]>(`${this.apiUrl}/${videoId}`, { params });
  }

  createComment(videoId: string, data: CreateCommentRequest): Observable<CommentWithUser> {
    return this.http.post<CommentWithUser>(`${this.apiUrl}/${videoId}`, data);
  }

  getComment(commentId: string): Observable<CommentWithUser> {
    return this.http.get<CommentWithUser>(`${this.apiUrl}/comment/${commentId}`);
  }

  updateComment(commentId: string, data: CreateCommentRequest): Observable<Comment> {
    return this.http.put<Comment>(`${this.apiUrl}/comment/${commentId}`, data);
  }

  deleteComment(commentId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/comment/${commentId}`);
  }

  getCommentCount(videoId: string): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/${videoId}/count`);
  }
}
