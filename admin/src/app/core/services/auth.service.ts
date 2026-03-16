import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthResponse {
  success: boolean;
  data: { user: AdminUser; accessToken: string };
}

interface MeResponse {
  success: boolean;
  data: AdminUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly _user = signal<AdminUser | null>(null);
  private readonly _token = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());

  constructor() {
    const saved =
      typeof localStorage !== 'undefined' ? localStorage.getItem('admin_accessToken') : null;
    if (saved) this._token.set(saved);
  }

  async init(): Promise<void> {
    if (!this._token()) return;
    try {
      const res = await firstValueFrom(this.api.get<MeResponse>('/auth/me'));
      if (res.data.role !== 'admin' && res.data.role !== 'employee') {
        this.clearAuth();
        return;
      }
      this._user.set(res.data);
    } catch {
      this.clearAuth();
    }
  }

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.api.post<AuthResponse>('/auth/login', { email, password }),
    );
    if (res.data.user.role !== 'admin' && res.data.user.role !== 'employee') {
      throw new Error('Acceso denegado');
    }
    this._token.set(res.data.accessToken);
    this._user.set(res.data.user);
    localStorage.setItem('admin_accessToken', res.data.accessToken);
  }

  async refreshToken(): Promise<string> {
    const res = await firstValueFrom(this.api.post<AuthResponse>('/auth/refresh'));
    this._token.set(res.data.accessToken);
    this._user.set(res.data.user);
    localStorage.setItem('admin_accessToken', res.data.accessToken);
    return res.data.accessToken;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.api.post('/auth/logout'));
    } catch {
      /* ignore */
    }
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this._token();
  }

  private clearAuth(): void {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem('admin_accessToken');
  }
}
