import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UpdateUserRequest } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }

  updateCurrentUser(data: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/me`, data);
  }

  updateCurrentField(field: keyof UpdateUserRequest, value: any): Observable<User> {
    const payload: any = { [field]: value };
    return this.http.put<User>(`${this.apiUrl}/me`, payload);
  }

  uploadPhoto(photo: File): Observable<User> {
    const formData = new FormData();
    formData.append('photo', photo);
    return this.http.post<User>(`${this.apiUrl}/me/photo`, formData);
  }

  removePhoto(): Observable<User> {
    return this.http.delete<User>(`${this.apiUrl}/me/photo`);
  }

  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ success: boolean }>{
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/me/password`, { currentPassword, newPassword });
  }
}
