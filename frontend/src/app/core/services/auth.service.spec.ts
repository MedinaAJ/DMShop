import { TestBed, fakeAsync } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

const BASE = environment.apiUrl;

const mockUser = {
  id: 1,
  email: 'test@example.com',
  firstName: 'Ana',
  lastName: 'García',
  role: 'customer',
};

const mockAuthResponse = {
  success: true,
  data: {
    user: mockUser,
    accessToken: 'fake-jwt-token-abc123',
  },
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let mockStorage: jasmine.SpyObj<StorageService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockStorage = jasmine.createSpyObj('StorageService', ['getItem', 'setItem', 'removeItem']);
    mockStorage.getItem.and.returnValue(null); // sin token guardado por defecto
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        AuthService,
        { provide: StorageService, useValue: mockStorage },
        { provide: Router, useValue: mockRouter },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('isAuthenticated es false cuando no hay usuario', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.user()).toBeNull();
  });

  it('isAuthenticated es false sin token guardado en storage al iniciar', () => {
    mockStorage.getItem.and.returnValue(null);
    // El constructor ya leyó el storage; sin token, no hay usuario
    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('lee el token desde storage al inicializarse', () => {
    // Simular que ya había un token guardado: crear instancia con storage que devuelve token
    const storageWithToken = jasmine.createSpyObj('StorageService', ['getItem', 'setItem', 'removeItem']);
    storageWithToken.getItem.and.returnValue('saved-token');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        AuthService,
        { provide: StorageService, useValue: storageWithToken },
        { provide: Router, useValue: mockRouter },
      ],
    });
    const svc2 = TestBed.inject(AuthService);
    const http2 = TestBed.inject(HttpTestingController);

    expect(svc2.token()).toBe('saved-token');
    // isAuthenticated sigue false porque no se ha llamado a init() todavía
    expect(svc2.isAuthenticated()).toBeFalse();
    http2.verify();
  });

  it('login almacena token, actualiza user y guarda en storage', fakeAsync(async () => {
    const promise = service.login('test@example.com', 'password123');
    const req = httpMock.expectOne(`${BASE}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@example.com', password: 'password123' });
    req.flush(mockAuthResponse);
    const user = await promise;

    expect(user).toEqual(mockUser);
    expect(service.user()).toEqual(mockUser);
    expect(service.token()).toBe('fake-jwt-token-abc123');
    expect(service.isAuthenticated()).toBeTrue();
    expect(mockStorage.setItem).toHaveBeenCalledWith('accessToken', 'fake-jwt-token-abc123');
  }));

  it('register llama a POST /auth/register y actualiza el estado', fakeAsync(async () => {
    const registerData = {
      email: 'nuevo@example.com',
      password: 'pass456',
      firstName: 'Carlos',
      lastName: 'López',
      newsletter: true,
    };
    const registerResponse = {
      success: true,
      data: {
        user: { ...mockUser, email: 'nuevo@example.com', firstName: 'Carlos', lastName: 'López' },
        accessToken: 'register-token-xyz',
      },
    };

    const promise = service.register(registerData);
    const req = httpMock.expectOne(`${BASE}/auth/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(registerData);
    req.flush(registerResponse);
    await promise;

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.token()).toBe('register-token-xyz');
    expect(mockStorage.setItem).toHaveBeenCalledWith('accessToken', 'register-token-xyz');
  }));

  it('logout limpia el token y el usuario y navega a /', fakeAsync(async () => {
    // Primero hacer login para tener estado
    const loginPromise = service.login('test@example.com', 'password123');
    const loginReq = httpMock.expectOne(`${BASE}/auth/login`);
    loginReq.flush(mockAuthResponse);
    await loginPromise;
    expect(service.isAuthenticated()).toBeTrue();

    // Ahora logout
    const logoutPromise = service.logout();
    const logoutReq = httpMock.expectOne(`${BASE}/auth/logout`);
    expect(logoutReq.request.method).toBe('POST');
    logoutReq.flush({ success: true });
    await logoutPromise;

    expect(service.user()).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(mockStorage.removeItem).toHaveBeenCalledWith('accessToken');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  }));

  it('logout limpia el estado aunque el servidor devuelva error', fakeAsync(async () => {
    // Hacer login primero
    const loginPromise = service.login('test@example.com', 'password123');
    const loginReq = httpMock.expectOne(`${BASE}/auth/login`);
    loginReq.flush(mockAuthResponse);
    await loginPromise;

    // Logout con error del servidor
    const logoutPromise = service.logout();
    const logoutReq = httpMock.expectOne(`${BASE}/auth/logout`);
    logoutReq.flush('Error', { status: 500, statusText: 'Server Error' });
    await logoutPromise;

    // A pesar del error, el estado se limpia
    expect(service.user()).toBeNull();
    expect(service.token()).toBeNull();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  }));

  it('init() carga el usuario desde /auth/me cuando hay token', fakeAsync(async () => {
    // Simular token previo
    mockStorage.getItem.and.returnValue('existing-token');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        AuthService,
        { provide: StorageService, useValue: mockStorage },
        { provide: Router, useValue: mockRouter },
      ],
    });
    const svc2 = TestBed.inject(AuthService);
    const http2 = TestBed.inject(HttpTestingController);

    const promise = svc2.init();
    const req = http2.expectOne(`${BASE}/auth/me`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockUser });
    await promise;

    expect(svc2.user()).toEqual(mockUser);
    expect(svc2.isAuthenticated()).toBeTrue();
    http2.verify();
  }));

  it('isAdmin es true para rol admin', fakeAsync(async () => {
    const adminResponse = {
      success: true,
      data: { user: { ...mockUser, role: 'admin' }, accessToken: 'admin-token' },
    };
    const promise = service.login('admin@example.com', 'adminpass');
    const req = httpMock.expectOne(`${BASE}/auth/login`);
    req.flush(adminResponse);
    await promise;
    expect(service.isAdmin()).toBeTrue();
  }));

  it('isAdmin es false para rol customer', fakeAsync(async () => {
    const promise = service.login('test@example.com', 'password123');
    const req = httpMock.expectOne(`${BASE}/auth/login`);
    req.flush(mockAuthResponse); // rol customer
    await promise;
    expect(service.isAdmin()).toBeFalse();
  }));

  it('getToken() devuelve el token actual', fakeAsync(async () => {
    expect(service.getToken()).toBeNull();
    const promise = service.login('test@example.com', 'password123');
    const req = httpMock.expectOne(`${BASE}/auth/login`);
    req.flush(mockAuthResponse);
    await promise;
    expect(service.getToken()).toBe('fake-jwt-token-abc123');
  }));
});
