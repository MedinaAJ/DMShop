import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, Subject, BehaviorSubject } from 'rxjs';
import { CatalogComponent } from './catalog.component';
import { ProductService, ProductFilters } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { ApiService } from '../../core/services/api.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';

const mockProductList = [
  {
    id: 1,
    reference: 'R1',
    price: 19.99,
    quantity: 5,
    active: true,
    name: 'Producto A',
    slug: 'producto-a',
    descriptionShort: null,
    coverImage: null,
    manufacturerName: null,
    categoryName: 'Cat 1',
  },
];

const mockPaginatedResponse = {
  success: true,
  data: mockProductList,
  meta: { page: 1, perPage: 12, total: 1, totalPages: 1 },
};

function createCatalogTestBed(queryParams: Record<string, string> = {}, routeParams: Record<string, string> = {}) {
  const queryParams$ = new BehaviorSubject(queryParams);
  const routeParams$ = new BehaviorSubject(routeParams);

  const mockProductService = jasmine.createSpyObj('ProductService', ['list']);
  mockProductService.list.and.returnValue(of(mockPaginatedResponse));

  const mockCategoryService = jasmine.createSpyObj('CategoryService', ['getTree', 'getById']);
  mockCategoryService.getTree.and.returnValue(of([]));
  mockCategoryService.getById.and.returnValue(of({
    id: 3,
    idParent: null,
    position: 1,
    active: true,
    translations: { es: { name: 'Electrónica', description: null, slug: 'electronica' } },
  }));

  const mockApiService = jasmine.createSpyObj('ApiService', ['get']);
  mockApiService.get.and.returnValue(of({ data: [] }));

  const mockRouter = jasmine.createSpyObj('Router', ['navigate']);

  TestBed.configureTestingModule({
    imports: [CatalogComponent, NoopAnimationsModule],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          params: routeParams$.asObservable(),
          queryParams: queryParams$.asObservable(),
          snapshot: {
            params: convertToParamMap(routeParams),
            queryParams: convertToParamMap(queryParams),
          },
        },
      },
      { provide: ProductService, useValue: mockProductService },
      { provide: CategoryService, useValue: mockCategoryService },
      { provide: ApiService, useValue: mockApiService },
      { provide: Router, useValue: mockRouter },
    ],
  });

  const fixture = TestBed.createComponent(CatalogComponent);
  const component = fixture.componentInstance;

  return { component, fixture, mockProductService, mockCategoryService, mockApiService, mockRouter, queryParams$, routeParams$ };
}

describe('CatalogComponent', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('debería crearse correctamente', () => {
    const { component } = createCatalogTestBed();
    expect(component).toBeTruthy();
  });

  it('carga la lista de productos al inicializar (ngOnInit)', fakeAsync(() => {
    const { component, mockProductService } = createCatalogTestBed();

    component.ngOnInit();
    tick(500); // debounce + async

    expect(mockProductService.list).toHaveBeenCalled();
    expect(component.products).toEqual(mockProductList);
    expect(component.totalItems).toBe(1);
  }));

  it('loadProducts() llama a productService.list con los filtros actuales', () => {
    const { component, mockProductService } = createCatalogTestBed();
    component.page = 1;
    component.perPage = 12;

    component.loadProducts();

    expect(mockProductService.list).toHaveBeenCalledWith(
      jasmine.objectContaining({ page: 1, perPage: 12 }),
    );
  });

  it('restaura la página desde query params', fakeAsync(() => {
    const { component } = createCatalogTestBed({ page: '3', perPage: '24' });

    component.ngOnInit();
    tick(500);

    expect(component.page).toBe(3);
    expect(component.perPage).toBe(24);
  }));

  it('restaura searchQuery desde query params', fakeAsync(() => {
    const { component } = createCatalogTestBed({ search: 'camiseta' });

    component.ngOnInit();
    tick(500);

    expect(component.searchQuery).toBe('camiseta');
  }));

  it('restaura min_price y max_price desde query params', fakeAsync(() => {
    const { component } = createCatalogTestBed({ min_price: '10', max_price: '100' });

    component.ngOnInit();
    tick(500);

    expect(component.minPrice).toBe(10);
    expect(component.maxPrice).toBe(100);
  }));

  it('loadProducts() incluye filtro idCategory cuando categoryId está definido', () => {
    const { component, mockProductService } = createCatalogTestBed();
    component.categoryId = 5;

    component.loadProducts();

    expect(mockProductService.list).toHaveBeenCalledWith(
      jasmine.objectContaining({ idCategory: 5 }),
    );
  });

  it('loadProducts() incluye search si hay búsqueda activa', () => {
    const { component, mockProductService } = createCatalogTestBed();
    component.searchQuery = 'bolso';

    component.loadProducts();

    expect(mockProductService.list).toHaveBeenCalledWith(
      jasmine.objectContaining({ search: 'bolso' }),
    );
  });

  it('loadProducts() incluye min_price y max_price cuando están definidos', () => {
    const { component, mockProductService } = createCatalogTestBed();
    component.minPrice = 10;
    component.maxPrice = 50;

    component.loadProducts();

    expect(mockProductService.list).toHaveBeenCalledWith(
      jasmine.objectContaining({ min_price: 10, max_price: 50 }),
    );
  });

  it('loadProducts() no incluye min_price si es null', () => {
    const { component, mockProductService } = createCatalogTestBed();
    component.minPrice = null;
    component.maxPrice = null;

    component.loadProducts();

    const callArgs = mockProductService.list.calls.mostRecent().args[0] as ProductFilters;
    expect(callArgs.min_price).toBeUndefined();
    expect(callArgs.max_price).toBeUndefined();
  });

  it('onPage() actualiza page y perPage y recarga productos', () => {
    const { component, mockProductService, mockRouter } = createCatalogTestBed();
    mockProductService.list.calls.reset();

    const pageEvent: PageEvent = { pageIndex: 2, pageSize: 24, length: 100 };
    component.onPage(pageEvent);

    expect(component.page).toBe(3);
    expect(component.perPage).toBe(24);
    expect(mockProductService.list).toHaveBeenCalledWith(
      jasmine.objectContaining({ page: 3, perPage: 24 }),
    );
  });

  it('hasActiveFilters() devuelve false cuando no hay filtros activos', () => {
    const { component } = createCatalogTestBed();
    component.searchQuery = '';
    component.minPrice = null;
    component.maxPrice = null;
    component.selectedManufacturers.clear();
    component.inStock = false;

    expect(component.hasActiveFilters()).toBeFalse();
  });

  it('hasActiveFilters() devuelve true si hay searchQuery', () => {
    const { component } = createCatalogTestBed();
    component.searchQuery = 'test';

    expect(component.hasActiveFilters()).toBeTrue();
  });

  it('hasActiveFilters() devuelve true si hay filtro de precio', () => {
    const { component } = createCatalogTestBed();
    component.minPrice = 5;

    expect(component.hasActiveFilters()).toBeTrue();
  });

  it('clearFilters() resetea todos los filtros', () => {
    const { component, mockProductService } = createCatalogTestBed();
    component.searchQuery = 'test';
    component.minPrice = 10;
    component.maxPrice = 100;
    component.inStock = true;
    component.selectedManufacturers.add(1);
    mockProductService.list.calls.reset();

    component.clearFilters();

    expect(component.searchQuery).toBe('');
    expect(component.minPrice).toBeNull();
    expect(component.maxPrice).toBeNull();
    expect(component.inStock).toBeFalse();
    expect(component.selectedManufacturers.size).toBe(0);
    expect(component.page).toBe(1);
    expect(mockProductService.list).toHaveBeenCalled();
  });

  it('clearSearch() borra searchQuery y dispara onFilterChange', fakeAsync(() => {
    const { component, mockProductService } = createCatalogTestBed();
    component.ngOnInit();
    tick(500);
    component.searchQuery = 'pantalón';
    mockProductService.list.calls.reset();

    component.clearSearch();
    tick(500);

    expect(component.searchQuery).toBe('');
    expect(mockProductService.list).toHaveBeenCalled();
  }));

  it('toggleManufacturer() añade o elimina el fabricante de selectedManufacturers', () => {
    const { component } = createCatalogTestBed();

    component.toggleManufacturer(1, true);
    expect(component.selectedManufacturers.has(1)).toBeTrue();

    component.toggleManufacturer(1, false);
    expect(component.selectedManufacturers.has(1)).toBeFalse();
  });

  it('loadProducts() incluye in_stock=true si inStock está activo', () => {
    const { component, mockProductService } = createCatalogTestBed();
    component.inStock = true;

    component.loadProducts();

    expect(mockProductService.list).toHaveBeenCalledWith(
      jasmine.objectContaining({ in_stock: true }),
    );
  });

  it('restaura in_stock desde query params', fakeAsync(() => {
    const { component } = createCatalogTestBed({ in_stock: 'true' });

    component.ngOnInit();
    tick(500);

    expect(component.inStock).toBeTrue();
  }));
});
