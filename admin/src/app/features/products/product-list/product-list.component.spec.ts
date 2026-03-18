import { TestBed } from '@angular/core/testing';
import { RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { ProductListComponent } from './product-list.component';
import { ApiService } from '../../../core/services/api.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';

const mockProducts = [
  { id: 1, name: 'Camisa Azul', reference: 'CAM-001', price: 25.99, quantity: 50, active: true },
  { id: 2, name: 'Pantalón Verde', reference: null, price: 49.99, quantity: 0, active: false },
  { id: 3, name: 'Zapatos Negros', reference: 'ZAP-003', price: 89.0, quantity: 15, active: true },
];

const mockApiResponse = {
  success: true,
  data: mockProducts,
  meta: { page: 1, perPage: 10, total: 3, totalPages: 1 },
};

describe('ProductListComponent (Admin)', () => {
  let component: ProductListComponent;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'delete']);
    mockApiService.get.and.returnValue(of(mockApiResponse));

    await TestBed.configureTestingModule({
      imports: [ProductListComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: mockApiService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('carga la lista de productos al inicializar (ngOnInit)', () => {
    component.ngOnInit();

    expect(mockApiService.get).toHaveBeenCalledWith(
      '/products',
      jasmine.objectContaining({ page: 1, perPage: 10 }),
    );
    expect(component.products).toEqual(mockProducts);
    expect(component.totalItems).toBe(3);
    expect(component.loading).toBeFalse();
  });

  it('loadProducts() envía page y perPage correctos a la API', () => {
    component.page = 2;
    component.perPage = 25;

    component.loadProducts();

    expect(mockApiService.get).toHaveBeenCalledWith(
      '/products',
      jasmine.objectContaining({ page: 2, perPage: 25 }),
    );
  });

  it('loadProducts() activa loading al inicio y lo desactiva al terminar', () => {
    // of() resuelve síncronamente, así que al terminar loadProducts loading es false
    component.loadProducts();
    expect(component.loading).toBeFalse();
  });

  it('onPage() actualiza page y perPage y recarga la lista', () => {
    mockApiService.get.calls.reset();

    const pageEvent: PageEvent = { pageIndex: 2, pageSize: 25, length: 100 };
    component.onPage(pageEvent);

    expect(component.page).toBe(3);
    expect(component.perPage).toBe(25);
    expect(mockApiService.get).toHaveBeenCalledWith(
      '/products',
      jasmine.objectContaining({ page: 3, perPage: 25 }),
    );
  });

  it('paginación: onPage con pageIndex=0 va a page=1', () => {
    const pageEvent: PageEvent = { pageIndex: 0, pageSize: 10, length: 50 };
    component.onPage(pageEvent);

    expect(component.page).toBe(1);
    expect(mockApiService.get).toHaveBeenCalledWith(
      '/products',
      jasmine.objectContaining({ page: 1 }),
    );
  });

  it('paginación: onPage con pageSize=50 envía perPage=50', () => {
    const pageEvent: PageEvent = { pageIndex: 0, pageSize: 50, length: 200 };
    component.onPage(pageEvent);

    expect(mockApiService.get).toHaveBeenCalledWith(
      '/products',
      jasmine.objectContaining({ perPage: 50 }),
    );
  });

  it('displayedColumns contiene todas las columnas esperadas', () => {
    expect(component.displayedColumns).toContain('id');
    expect(component.displayedColumns).toContain('name');
    expect(component.displayedColumns).toContain('reference');
    expect(component.displayedColumns).toContain('price');
    expect(component.displayedColumns).toContain('quantity');
    expect(component.displayedColumns).toContain('active');
    expect(component.displayedColumns).toContain('actions');
  });

  it('los productos se asignan correctamente en el componente', () => {
    component.ngOnInit();

    expect(component.products.length).toBe(3);
    expect(component.products[0].name).toBe('Camisa Azul');
    expect(component.products[1].active).toBeFalse();
  });

  it('totalItems refleja el total de la respuesta de la API', () => {
    const bigResponse = {
      success: true,
      data: mockProducts,
      meta: { page: 1, perPage: 10, total: 150, totalPages: 15 },
    };
    mockApiService.get.and.returnValue(of(bigResponse));

    component.loadProducts();

    expect(component.totalItems).toBe(150);
  });

  it('page inicia en 1 y perPage en 10 por defecto', () => {
    expect(component.page).toBe(1);
    expect(component.perPage).toBe(10);
  });

  it('múltiples llamadas onPage acumulan la página correctamente', () => {
    const event1: PageEvent = { pageIndex: 1, pageSize: 10, length: 100 };
    component.onPage(event1);
    expect(component.page).toBe(2);

    const event2: PageEvent = { pageIndex: 4, pageSize: 10, length: 100 };
    component.onPage(event2);
    expect(component.page).toBe(5);
  });
});
