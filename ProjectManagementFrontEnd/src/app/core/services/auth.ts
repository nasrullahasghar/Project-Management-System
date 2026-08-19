import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

// Shapes matching your backend exactly
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  fullName: string;
  email: string;
  role: string;
}

const API_BASE = 'http://localhost:8000/api/auth';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private http = inject(HttpClient);

  // Holds the full logged-in user info (or null if logged out).
  // private set() so only this service can change it.
  private currentUserSignal = signal<AuthResponse | null>(null);

  // Public, READ-ONLY view of the same data for components to use.
  readonly currentUser = this.currentUserSignal.asReadonly();

  // Derived values — automatically recompute whenever currentUserSignal changes.
  readonly isLoggedIn = computed(() => this.currentUserSignal() !== null);
  readonly role = computed(() => this.currentUserSignal()?.role ?? null);

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE}/login`, request).pipe(
      tap((response) => this.currentUserSignal.set(response))
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE}/register`, request).pipe(
      tap((response) => this.currentUserSignal.set(response))
    );
  }

  logout(): void {
    this.currentUserSignal.set(null);
  }

  getToken(): string | null {
    return this.currentUserSignal()?.token ?? null;
  }
}