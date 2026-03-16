import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { firstValueFrom } from 'rxjs';

interface UserPublic {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthResponse {
  success: boolean;
  data: {
    user: UserPublic;
    accessToken: string;
  };
}

interface MeResponse {
  success: boolean;
  data: UserPublic;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);

  private readonly _user = signal<UserPublic | null>(null);
  private readonly _token = signal<string | null>(null);
  private readonly _loading = signal(false);

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());
  readonly isAdmin = computed(
    () => this._user()?.role === 'admin' || this._user()?.role === 'employee',
  );

  constructor() {
    const savedToken = this.storage.getItem('accessToken');
    if (savedToken) {
      this._token.set(savedToken);
    }
  }

  async init(): Promise<void> {
    if (!this._token()) return;
    try {
      this._loading.set(true);
      const res = await firstValueFrom(this.api.get<MeResponse>('/auth/me'));
      this._user.set(res.data);
    } catch {
      this.clearAuth();
    } finally {
      this._loading.set(false);
    }
  }

  async login(email: string, password: string): Promise<UserPublic> {
    const res = await firstValueFrom(
      this.api.post<AuthResponse>('/auth/login', { email, password }),
    );
    this.setAuth(res.data.accessToken, res.data.user);
    return res.data.user;
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    newsletter?: boolean;
  }): Promise<UserPublic> {
    const res = await firstValueFrom(this.api.post<AuthResponse>('/auth/register', data));
    this.setAuth(res.data.accessToken, res.data.user);
    return res.data.user;
  }

  async refreshToken(): Promise<string> {
    const res = await firstValueFrom(this.api.post<AuthResponse>('/auth/refresh'));
    this.setAuth(res.data.accessToken, res.data.user);
    return res.data.accessToken;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.api.post('/auth/logout'));
    } catch {
      // Ignore errors on logout
    }
    this.clearAuth();
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return this._token();
  }

  private setAuth(token: string, user: UserPublic): void {
    this._token.set(token);
    this._user.set(user);
    this.storage.setItem('accessToken', token);
  }

  private clearAuth(): void {
    this._token.set(null);
    this._user.set(null);
    this.storage.removeItem('accessToken');
  }
}
