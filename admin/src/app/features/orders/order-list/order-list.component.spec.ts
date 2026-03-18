import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { OrderListComponent } from './order-list.component';
import { ApiService } from '../../../core/services/api.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';

const mockOrderStates = [
  { id: 1, name: 'Pendiente', color: '#FFA500' },
  { id: 2, name: 'Enviado', color: '#008000' },
  { id: 3, name: 'Cancelado', color: '#FF0000' },
];

const mockOrders = [
  {
    id: 101,
    reference: 'REF-101',
    customerName: 'María González',
    customerEmail: 'maria@example.com',
    stateName: 'Pendiente',
    stateColor: '#FFA500',
    paymentMethod: 'stripe',
    totalPaid: 59.99,
    itemCount: 2,
    createdAt: '2024-03-01T10:00:00Z',
  },
  {
    id: 102,
    reference: 'REF-102',
    customerName: 'Pedro Martínez',
    customerEmail: 'pedro@example.com',
    stateName: 'Enviado',
    stateColor: '#008000',
    paymentMethod: 'paypal',
    totalPaid: 120.0,
    itemCount: 3,
    createdAt: '2024-03-02T12:00:00Z',
  },
];

const mockOrderListResponse = {
  success: true,
  data: mockOrders,
  meta: { total: 2 },
};

const mockStatesResponse = {
  success: true,
  data: mockOrderStates,
};

describe('OrderListComponent (Admin)', () => {
  let component: OrderListComponent;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'delete']);
    mockApiService.get.and.callFake((path: string) => {
      if (path === '/orders/states') return of(mockStatesResponse);
      if (path === '/orders/admin/list') return of(mockOrderListResponse);
      return of({ success: true, data: [], meta: { total: 0 } });
    });

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [OrderListComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: mockApiService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(OrderListComponent);
    component = fixture.componentInstance;
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('carga los estados de pedido y la lista de pedidos al inicializar', () => {
    component.ngOnInit();

    expect(mockApiService.get).toHaveBeenCalledWith(
      '/orders/states',
    );
    expect(mockApiService.get).toHaveBeenCalledWith(
      '/orders/admin/list',
      jasmine.objectContaining({ page: 1, limit: 20 }),
    );

    expect(component.states).toEqual(mockOrderStates);
    expect(component.orders).toEqual(mockOrders);
    expect(component.totalOrders).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('loadOrders() incluye el parámetro state al filtrar por estado', () => {
    component.filterState = 1;
    component.loadOrders();

    expect(mockApiService.get).toHaveBeenCalledWith(
      '/orders/admin/list',
      jasmine.objectContaining({ state: 1 }),
    );
  });

  it('loadOrders() incluye el parámetro q al filtrar por referencia', () => {
    component.searchQuery = 'REF-101';
    component.loadOrders();

    expect(mockApiService.get).toHaveBeenCalledWith(
      '/orders/admin/list',
      jasmine.objectContaining({ q: 'REF-101' }),
    );
  });

  it('loadOrders() NO incluye state=null en los params cuando filterState es null', () => {
    component.filterState = null;
    component.loadOrders();

    const callArgs = mockApiService.get.calls.mostRecent().args;
    const params = callArgs[1] as Record<string, any>;
    expect(params['state']).toBeUndefined();
  });

  it('viewOrder() navega a /orders/:id', () => {
    component.viewOrder(101);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/orders', 101]);
  });

  it('onPage() actualiza page y pageSize y recarga pedidos', () => {
    mockApiService.get.calls.reset();

    const pageEvent: PageEvent = { pageIndex: 1, pageSize: 50, length: 100 };
    component.onPage(pageEvent);

    expect(component.page).toBe(2);
    expect(component.pageSize).toBe(50);
    expect(mockApiService.get).toHaveBeenCalledWith(
      '/orders/admin/list',
      jasmine.objectContaining({ page: 2, limit: 50 }),
    );
  });

  it('resetFilters() limpia los filtros y recarga los pedidos', () => {
    component.searchQuery = 'REF-XYZ';
    component.filterState = 2;
    component.page = 3;
    mockApiService.get.calls.reset();

    component.resetFilters();

    expect(component.searchQuery).toBe('');
    expect(component.filterState).toBeNull();
    expect(component.page).toBe(1);
    expect(mockApiService.get).toHaveBeenCalledWith(
      '/orders/admin/list',
      jasmine.objectContaining({ page: 1 }),
    );
  });

  it('loading se activa durante la carga y se desactiva al terminar', () => {
    // Simular respuesta síncrona (of() es síncrono)
    component.loadOrders();
    // Tras llamar loadOrders(), como of() resuelve síncronamente, loading ya es false
    expect(component.loading).toBeFalse();
  });

  it('displayedColumns incluye las columnas esperadas', () => {
    expect(component.displayedColumns).toContain('id');
    expect(component.displayedColumns).toContain('reference');
    expect(component.displayedColumns).toContain('customer');
    expect(component.displayedColumns).toContain('state');
    expect(component.displayedColumns).toContain('total');
    expect(component.displayedColumns).toContain('actions');
  });
});
