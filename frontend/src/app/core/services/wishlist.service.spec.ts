import { TestBed, fakeAsync } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WishlistService } from './wishlist.service';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const BASE = environment.apiUrl;

const mockProduct = {
  id: 10,
  name: 'Producto Favorito',
  slug: 'producto-favorito',
  price: 29.99,
  quantity: 5,
  active: true,
  coverImage: null,
};

const mockWishlistData = {
  id: 1,
  name: 'Mi lista de deseos',
  items: [
    {
      id_product: 10,
      id_combination: null,
      created_at: '2024-01-15T10:00:00Z',
      product: mockProduct,
    },
  ],
};

const mockWishlistResponse = { success: true, data: mockWishlistData };

describe('WishlistService', () => {
  let service: WishlistService;
  let httpMock: HttpTestingController;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['isAuthenticated'], {
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true),
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        WishlistService,
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
    service = TestBed.inject(WishlistService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('load() envía GET /wishlist y actualiza el signal wishlist', fakeAsync(async () => {
    const promise = service.load();
    const req = httpMock.expectOne(`${BASE}/wishlist`);
    expect(req.request.method).toBe('GET');
    req.flush(mockWishlistResponse);
    await promise;
    expect(service.wishlist()).toEqual(mockWishlistData);
  }));

  it('load() no hace petición HTTP si el usuario no está autenticado', fakeAsync(async () => {
    mockAuthService.isAuthenticated.and.returnValue(false);
    await service.load();
    httpMock.expectNone(`${BASE}/wishlist`);
    expect(service.wishlist()).toBeNull();
  }));

  it('itemCount computed devuelve el número de items de la wishlist', fakeAsync(async () => {
    expect(service.itemCount()).toBe(0);
    const promise = service.load();
    const req = httpMock.expectOne(`${BASE}/wishlist`);
    req.flush(mockWishlistResponse);
    await promise;
    expect(service.itemCount()).toBe(1);
  }));

  it('addItem() envía POST /wishlist/items y recarga la wishlist', fakeAsync(async () => {
    const promise = service.addItem(20);

    // POST al añadir item
    const postReq = httpMock.expectOne(`${BASE}/wishlist/items`);
    expect(postReq.request.method).toBe('POST');
    expect(postReq.request.body).toEqual({ id_product: 20, id_combination: null });
    postReq.flush({ success: true });

    // GET de recarga
    const getReq = httpMock.expectOne(`${BASE}/wishlist`);
    getReq.flush(mockWishlistResponse);

    await promise;
  }));

  it('addItem() envía id_combination cuando se proporciona', fakeAsync(async () => {
    const promise = service.addItem(20, 5);

    const postReq = httpMock.expectOne(`${BASE}/wishlist/items`);
    expect(postReq.request.body).toEqual({ id_product: 20, id_combination: 5 });
    postReq.flush({ success: true });

    const getReq = httpMock.expectOne(`${BASE}/wishlist`);
    getReq.flush(mockWishlistResponse);
    await promise;
  }));

  it('addItem() no hace petición si el usuario no está autenticado', fakeAsync(async () => {
    mockAuthService.isAuthenticated.and.returnValue(false);
    await service.addItem(20);
    httpMock.expectNone(`${BASE}/wishlist/items`);
  }));

  it('removeItem() envía DELETE /wishlist/items/:productId y recarga', fakeAsync(async () => {
    const promise = service.removeItem(10);

    const deleteReq = httpMock.expectOne(`${BASE}/wishlist/items/10`);
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({ success: true });

    const getReq = httpMock.expectOne(`${BASE}/wishlist`);
    getReq.flush(mockWishlistResponse);
    await promise;
  }));

  it('removeItem() no hace petición si el usuario no está autenticado', fakeAsync(async () => {
    mockAuthService.isAuthenticated.and.returnValue(false);
    await service.removeItem(10);
    httpMock.expectNone(`${BASE}/wishlist/items/10`);
  }));

  it('check() envía GET /wishlist/check/:productId y actualiza el caché', fakeAsync(async () => {
    const promise = service.check(10);
    const req = httpMock.expectOne(`${BASE}/wishlist/check/10`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: { inWishlist: true } });
    const result = await promise;
    expect(result).toBeTrue();
    // Ahora isInWishlist debe devolver true desde el caché
    expect(service.isInWishlist(10)).toBeTrue();
  }));

  it('check() devuelve false si el usuario no está autenticado', fakeAsync(async () => {
    mockAuthService.isAuthenticated.and.returnValue(false);
    const result = await service.check(99);
    httpMock.expectNone(`${BASE}/wishlist/check/99`);
    expect(result).toBeFalse();
  }));

  it('isInWishlist() devuelve true si el productId está en la wishlist cargada', fakeAsync(async () => {
    const promise = service.load();
    const req = httpMock.expectOne(`${BASE}/wishlist`);
    req.flush(mockWishlistResponse);
    await promise;
    // id_product: 10 está en mockWishlistData.items
    expect(service.isInWishlist(10)).toBeTrue();
  }));

  it('isInWishlist() devuelve false si el productId NO está en la wishlist', fakeAsync(async () => {
    const promise = service.load();
    const req = httpMock.expectOne(`${BASE}/wishlist`);
    req.flush(mockWishlistResponse);
    await promise;
    expect(service.isInWishlist(999)).toBeFalse();
  }));

  it('isInWishlist() devuelve false sin wishlist cargada', () => {
    expect(service.isInWishlist(10)).toBeFalse();
  });

  it('toggle() llama a removeItem si el producto ya está en la wishlist', fakeAsync(async () => {
    // Cargar wishlist primero
    const loadPromise = service.load();
    const loadReq = httpMock.expectOne(`${BASE}/wishlist`);
    loadReq.flush(mockWishlistResponse);
    await loadPromise;

    expect(service.isInWishlist(10)).toBeTrue();

    // toggle sobre un producto que ya está → removeItem
    const togglePromise = service.toggle(10);
    const deleteReq = httpMock.expectOne(`${BASE}/wishlist/items/10`);
    deleteReq.flush({ success: true });
    const reloadReq = httpMock.expectOne(`${BASE}/wishlist`);
    reloadReq.flush({ success: true, data: { ...mockWishlistData, items: [] } });
    await togglePromise;
  }));

  it('toggle() llama a addItem si el producto NO está en la wishlist', fakeAsync(async () => {
    // 888 no está en la wishlist
    expect(service.isInWishlist(888)).toBeFalse();

    const togglePromise = service.toggle(888);
    const postReq = httpMock.expectOne(`${BASE}/wishlist/items`);
    expect(postReq.request.body).toEqual({ id_product: 888, id_combination: null });
    postReq.flush({ success: true });
    const reloadReq = httpMock.expectOne(`${BASE}/wishlist`);
    reloadReq.flush(mockWishlistResponse);
    await togglePromise;
  }));

  it('clear() resetea wishlist y caché sin petición HTTP', () => {
    service.clear();
    expect(service.wishlist()).toBeNull();
    expect(service.itemCount()).toBe(0);
  });
});
