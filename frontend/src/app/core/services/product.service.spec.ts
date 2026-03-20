import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService, ProductFilters } from './product.service';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

const BASE = environment.apiUrl;

const mockProductList = [
  {
    id: 1,
    reference: 'REF-001',
    price: 19.99,
    quantity: 10,
    active: true,
    name: 'Producto Uno',
    slug: 'producto-uno',
    descriptionShort: 'Descripción corta',
    coverImage: null,
    manufacturerName: 'Marca A',
    categoryName: 'Categoría 1',
  },
  {
    id: 2,
    reference: 'REF-002',
    price: 34.5,
    quantity: 5,
    active: true,
    name: 'Producto Dos',
    slug: 'producto-dos',
    descriptionShort: null,
    coverImage: '/images/p2.jpg',
    manufacturerName: null,
    categoryName: 'Categoría 2',
  },
];

const mockPaginatedResponse = {
  success: true,
  data: mockProductList,
  meta: { page: 1, perPage: 12, total: 2, totalPages: 1 },
};

const mockProductDetail = {
  id: 1,
  idCategoryDefault: 3,
  idManufacturer: null,
  reference: 'REF-001',
  ean13: null,
  price: 19.99,
  weight: 0.5,
  quantity: 10,
  active: true,
  availableForOrder: true,
  showPrice: true,
  translations: {
    es: { name: 'Producto Uno', description: '<p>Descripción completa</p>', descriptionShort: 'Desc corta', slug: 'producto-uno' },
  },
  images: [{ id: 1, path: '/images/p1.jpg', position: 1, cover: true }],
  categoryName: 'Categoría 1',
  manufacturerName: null,
};

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService, ProductService],
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('list() envía GET /products sin parámetros por defecto', (done) => {
    service.list().subscribe((res) => {
      expect(res.data).toEqual(mockProductList);
      done();
    });

    const req = httpMock.expectOne((r) => r.url === `${BASE}/products`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPaginatedResponse);
  });

  it('list() envía GET /products con parámetros page y perPage', (done) => {
    const filters: ProductFilters = { page: 2, perPage: 24 };
    service.list(filters).subscribe(() => done());

    const req = httpMock.expectOne((r) =>
      r.url === `${BASE}/products` &&
      r.params.get('page') === '2' &&
      r.params.get('perPage') === '24'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPaginatedResponse);
  });

  it('list() con filtro de categoría incluye idCategory en los params', (done) => {
    const filters: ProductFilters = { idCategory: 5 };
    service.list(filters).subscribe(() => done());

    const req = httpMock.expectOne((r) =>
      r.url === `${BASE}/products` &&
      r.params.get('idCategory') === '5'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPaginatedResponse);
  });

  it('list() con búsqueda incluye search en los params', (done) => {
    const filters: ProductFilters = { search: 'zapatos' };
    service.list(filters).subscribe(() => done());

    const req = httpMock.expectOne((r) =>
      r.url === `${BASE}/products` &&
      r.params.get('search') === 'zapatos'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPaginatedResponse);
  });

  it('list() con min_price y max_price incluye ambos params', (done) => {
    const filters: ProductFilters = { min_price: 10, max_price: 50 };
    service.list(filters).subscribe(() => done());

    const req = httpMock.expectOne((r) =>
      r.url === `${BASE}/products` &&
      r.params.get('min_price') === '10' &&
      r.params.get('max_price') === '50'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPaginatedResponse);
  });

  it('list() no incluye params con valor undefined o null o vacío', (done) => {
    const filters: ProductFilters = { search: undefined, idCategory: undefined };
    service.list(filters).subscribe(() => done());

    const req = httpMock.expectOne(`${BASE}/products`);
    expect(req.request.params.has('search')).toBeFalse();
    expect(req.request.params.has('idCategory')).toBeFalse();
    req.flush(mockPaginatedResponse);
  });

  it('getById() envía GET /products/:id y devuelve el detalle del producto', (done) => {
    service.getById(1).subscribe((product) => {
      expect(product).toEqual(mockProductDetail);
      done();
    });

    const req = httpMock.expectOne(`${BASE}/products/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockProductDetail });
  });

  it('getByCategory() llama a list() con idCategory correcto', (done) => {
    service.getByCategory(7).subscribe(() => done());

    const req = httpMock.expectOne((r) =>
      r.url === `${BASE}/products` &&
      r.params.get('idCategory') === '7'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPaginatedResponse);
  });

  it('getByCategory() combina params adicionales con idCategory', (done) => {
    service.getByCategory(3, { page: 2, search: 'bolsa' }).subscribe(() => done());

    const req = httpMock.expectOne((r) =>
      r.url === `${BASE}/products` &&
      r.params.get('idCategory') === '3' &&
      r.params.get('page') === '2' &&
      r.params.get('search') === 'bolsa'
    );
    req.flush(mockPaginatedResponse);
    done();
  });

  it('quickSearch() envía GET /search con q y limit', (done) => {
    service.quickSearch('camiseta', 5).subscribe((res) => {
      expect(res.data.length).toBe(1);
      done();
    });

    const req = httpMock.expectOne((r) =>
      r.url === `${BASE}/search` &&
      r.params.get('q') === 'camiseta' &&
      r.params.get('limit') === '5'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: [mockProductList[0]] });
  });

  it('quickSearch() usa limit=8 por defecto', (done) => {
    service.quickSearch('sombrero').subscribe(() => done());

    const req = httpMock.expectOne((r) =>
      r.url === `${BASE}/search` &&
      r.params.get('limit') === '8'
    );
    req.flush({ success: true, data: [] });
  });
});
