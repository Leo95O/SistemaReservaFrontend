import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, of, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, User } from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl || 'http://localhost:3000'; // Ajusta según tu env

  // Estado Reactivo (Signals)
  private _currentUser = signal<User | null>(null);
  public currentUser = computed(() => this._currentUser());

  constructor() {
    this.loadUserFromStorage();
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        this.saveToken(response.access_token);
        this.saveUser(response.user);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  // --- Helpers Internos ---
  private saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  private saveUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
    this._currentUser.set(user);
  }

  private loadUserFromStorage() {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        this._currentUser.set(JSON.parse(userJson));
      } catch {
        this.logout();
      }
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  hasRole(role: 'ADMIN' | 'CLIENT'): boolean {
    const user = this.currentUser();
    return user ? user.roles.includes(role) : false;
  }
}
