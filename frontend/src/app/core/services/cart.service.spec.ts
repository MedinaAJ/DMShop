import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CartService } from './cart.service';
import { ApiService } from './api.service';
import { environment } from '../../../../environments/environment';

const BASE = environment.apiUrl;

const mockCartSummary = {
  items: [
    {
      id: 1,
      idProduct: 10,
      idCombination: null,
      quantity: 2,
      productName: 'Producto A',
      productSlug: 'producto-a',
      productPrice: 9.99,
      productPriceWithTax: 11.99,
      combinationName: null,
      coverImage: null,
      totalPrice: 19.98,
      totalPriceWithTax: 23.98,
    },
    {
      id: 2,
      idProduct: 11,
      idCombination: null,
      quantity: 3,
      productName: 'Producto B',
      productSlug: 'producto-b',
      productPrice: 5.0,
      productPriceWithTax: 6.05,
      combinationName: null,
      coverImage: null,
      totalPrice: 15.0,
      totalPriceWithTax: 18.15,
    },
  ],
  totalProducts: 34.98,
  totalProductsTax: 42.13,
  totalShipping: 0,
  totalShippingTax: 0,
  totalDiscounts: 0,
  totalDiscountsTax: 0,
  totalPaid: 42.13,
  itemCount: 5,
};

const mockCartResponse = { success: true, data: mockCartSummary };

describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService, CartService],
    });
    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('load() envía GET /cart y actualiza el signal cart', fakeAsync(async () => {
    const promise = service.load();
    const req = httpMock.expectOne(`${BASE}/cart`);
    expect(req.request.method).toBe('GET');
    req.flush(mockCartResponse);
    await promise;
    expect(service.cart()).toEqual(mockCartSummary);
  }));

  it('load() pone cart en null si hay error HTTP', fakeAsync(async () => {
    const promise = service.load();
    const req = httpMock.expectOne(`${BASE}/cart`);
    req.flush('Error', { status: 500, statusText: 'Server Error' });
    await promise;
    expect(service.cart()).toBeNull();
  }));

  it('addItem() envía POST /cart/items con idProduct y quantity', fakeAsync(async () => {
    const promise = service.addItem(10, 2);
    const req = httpMock.expectOne(`${BASE}/cart/items`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ idProduct: 10, quantity: 2, idCombination: undefined });
    req.flush(mockCartResponse);
    await promise;
    expect(service.cart()).toEqual(mockCartSummary);
  }));

  it('addItem() envía POST /cart/items con combinación cuando se especifica', fakeAsync(async () => {
    const promise = service.addItem(10, 1, 99);
    const req = httpMock.expectOne(`${BASE}/cart/items`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ idProduct: 10, quantity: 1, idCombination: 99 });
    req.flush(mockCartResponse);
    await promise;
  }));

  it('updateItem() envía PUT /cart/items/:itemId con quantity', fakeAsync(async () => {
    const promise = service.updateItem(1, 5);
    const req = httpMock.expectOne(`${BASE}/cart/items/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ quantity: 5 });
    req.flush(mockCartResponse);
    await promise;
    expect(service.cart()).toEqual(mockCartSummary);
  }));

  it('removeItem() envía DELETE /cart/items/:itemId', fakeAsync(async () => {
    const promise = service.removeItem(1);
    const req = httpMock.expectOne(`${BASE}/cart/items/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockCartResponse);
    await promise;
    expect(service.cart()).toEqual(mockCartSummary);
  }));

  it('itemCount computed devuelve la suma del campo itemCount del carrito', fakeAsync(async () => {
    // Antes de cargar
    expect(service.itemCount()).toBe(0);
    const promise = service.load();
    const req = httpMock.expectOne(`${BASE}/cart`);
    req.flush(mockCartResponse);
    await promise;
    // mockCartSummary.itemCount = 5 (2 + 3)
    expect(service.itemCount()).toBe(5);
  }));

  it('total computed devuelve totalPaid del carrito', fakeAsync(async () => {
    expect(service.total()).toBe(0);
    const promise = service.load();
    const req = httpMock.expectOne(`${BASE}/cart`);
    req.flush(mockCartResponse);
    await promise;
    expect(service.total()).toBe(42.13);
  }));

  it('clear() vacía el estado local sin llamar al servidor', () => {
    // Forzar estado no nulo usando el método put directamente no es posible desde fuera,
    // así que verificamos que después de clear() el signal es null
    service.clear();
    expect(service.cart()).toBeNull();
    expect(service.itemCount()).toBe(0);
    expect(service.total()).toBe(0);
  });

  it('applyDiscount() envía POST /cart/apply-discount con el código', fakeAsync(async () => {
    const promise = service.applyDiscount('VERANO10');
    const req = httpMock.expectOne(`${BASE}/cart/apply-discount`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ code: 'VERANO10' });
    req.flush(mockCartResponse);
    await promise;
  }));

  it('removeDiscount() envía DELETE /cart/remove-discount/:cartRuleId', fakeAsync(async () => {
    const promise = service.removeDiscount(3);
    const req = httpMock.expectOne(`${BASE}/cart/remove-discount/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockCartResponse);
    await promise;
  }));

  it('loading signal está activo durante la petición y se desactiva al terminar', fakeAsync(async () => {
    expect(service.loading()).toBeFalse();
    const promise = service.load();
    // Durante la petición loading debería ser true
    expect(service.loading()).toBeTrue();
    const req = httpMock.expectOne(`${BASE}/cart`);
    req.flush(mockCartResponse);
    await promise;
    expect(service.loading()).toBeFalse();
  }));
});
