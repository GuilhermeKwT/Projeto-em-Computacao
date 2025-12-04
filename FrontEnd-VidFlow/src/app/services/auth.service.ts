import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, LoginRequest, LoginResponse, RegisterRequest } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  initializeAuth(): void {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = this.getToken();
    const userStr = localStorage.getItem('currentUser');
    const hasValidUserStr = !!userStr && userStr !== 'undefined' && userStr !== 'null' && userStr.trim() !== '';

    if (token && hasValidUserStr) {
      try {
        const user = JSON.parse(userStr!);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.warn('Error parsing user from storage, clearing currentUser', error);
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
      }
    } else {
      if (!token) {
        this.currentUserSubject.next(null);
      }
    }
  }

  register(data: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/users`, data).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/users/signin`, credentials).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private handleAuthResponse(response: LoginResponse): void {
    if (response && response.token) {
      localStorage.setItem('token', response.token);
    } else {
      localStorage.removeItem('token');
    }

    if (response && response.user) {
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      this.currentUserSubject.next(response.user);
    } else {
      localStorage.removeItem('currentUser');
      this.currentUserSubject.next(null);
    }
  }
}
