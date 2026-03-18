import { TestBed, fakeAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, Subject } from 'rxjs';
import { ProductDetailComponent } from './product-detail.component';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ReviewService } from '../../core/services/review.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

const mockProductDetail = {
  id: 1,
  idCategoryDefault: 3,
  idManufacturer: null,
  reference: 'REF-001',
  ean13: null,
  price: 29.99,
  weight: 0.5,
  quantity: 10,
  active: true,
  availableForOrder: true,
  showPrice: true,
  translations: {
    es: {
      name: 'Zapatillas Deportivas',
      description: '<p>Gran producto</p>',
      descriptionShort: 'Descripción breve',
      slug: 'zapatillas-deportivas',
    },
  },
  images: [{ id: 1, path: '/img/p1.jpg', position: 1, cover: true }],
  categoryName: 'Calzado',
  manufacturerName: 'Marca X',
};

const mockReviewStats = {
  reviews: [],
  avgRating: 0,
  totalReviews: 0,
  distribution: {},
  meta: { page: 1, perPage: 10, total: 0, totalPages: 0 },
};

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent;
  let mockProductService: jasmine.SpyObj<ProductService>;
  let mockCartService: jasmine.SpyObj<CartService>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockReviewService: jasmine.SpyObj<ReviewService>;
  let mockWishlistService: jasmine.SpyObj<WishlistService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let routeParams$: Subject<{ id: string }>;

  beforeEach(async () => {
    routeParams$ = new Subject<{ id: string }>();

    mockProductService = jasmine.createSpyObj('ProductService', ['getById']);
    mockProductService.getById.and.returnValue(of(mockProductDetail));

    mockCartService = jasmine.createSpyObj('CartService', ['addItem']);
    mockCartService.addItem.and.returnValue(Promise.resolve());

    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post']);
    mockApiService.get.and.returnValue(of({ data: [] }));

    mockAuthService = jasmine.createSpyObj('AuthService', ['isAuthenticated'], {
      isAuthenticated: jasmine.createSpy().and.returnValue(false),
    });

    mockReviewService = jasmine.createSpyObj('ReviewService', [
      'getProductReviews',
      'submitReview',
    ]);
    mockReviewService.getProductReviews.and.returnValue(Promise.resolve(mockReviewStats));

    mockWishlistService = jasmine.createSpyObj('WishlistService', ['isInWishlist', 'toggle'], {
      wishlist: jasmine.createSpy().and.returnValue(null),
    });
    mockWishlistService.isInWishlist.and.returnValue(false);

    const mockSnackBarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction']);
    mockSnackBarRef.onAction.and.returnValue(of(undefined));
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockSnackBar.open.and.returnValue(mockSnackBarRef);

    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            params: routeParams$.asObservable(),
            queryParams: of({}),
            snapshot: { params: { id: '1' } },
          },
        },
        { provide: ProductService, useValue: mockProductService },
        { provide: CartService, useValue: mockCartService },
        { provide: ApiService, useValue: mockApiService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ReviewService, useValue: mockReviewService },
        { provide: WishlistService, useValue: mockWishlistService },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProductDetailComponent);
    component = fixture.componentInstance;
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('carga el producto al recibir params con id', fakeAsync(async () => {
    component.ngOnInit();
    routeParams$.next({ id: '1' });

    await Promise.resolve(); // flush microtasks

    expect(mockProductService.getById).toHaveBeenCalledWith(1);
    expect(component.product).toEqual(mockProductDetail);
    expect(component.loading).toBeFalse();
  }));

  it('productName devuelve el nombre desde las traducciones', fakeAsync(async () => {
    component.ngOnInit();
    routeParams$.next({ id: '1' });
    await Promise.resolve();

    expect(component.productName).toBe('Zapatillas Deportivas');
  }));

  it('productDescription devuelve la descripción HTML desde las traducciones', fakeAsync(async () => {
    component.ngOnInit();
    routeParams$.next({ id: '1' });
    await Promise.resolve();

    expect(component.productDescription).toBe('<p>Gran producto</p>');
  }));

  it('effectiveStock devuelve la cantidad del producto cuando no hay combinación seleccionada', fakeAsync(async () => {
    component.ngOnInit();
    routeParams$.next({ id: '1' });
    await Promise.resolve();

    expect(component.effectiveStock).toBe(10);
  }));

  it('effectiveStock devuelve la cantidad de la combinación seleccionada', () => {
    component.product = { ...mockProductDetail };
    component.selectedCombination = { quantity: 3, price_impact: 5, reference: 'COMB-1' };

    expect(component.effectiveStock).toBe(3);
  });

  it('addToCart() llama a cartService.addItem con el id del producto y la cantidad', fakeAsync(async () => {
    component.product = { ...mockProductDetail };
    component.qty = 2;

    await component.addToCart();

    expect(mockCartService.addItem).toHaveBeenCalledWith(1, 2);
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Producto añadido al carrito',
      'Ver carrito',
      jasmine.objectContaining({ duration: 3000 }),
    );
  }));

  it('addToCart() muestra error si falla el servicio', fakeAsync(async () => {
    mockCartService.addItem.and.rejectWith(new Error('Network error'));
    component.product = { ...mockProductDetail };

    await component.addToCart();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Error al añadir al carrito',
      'Cerrar',
      jasmine.objectContaining({ duration: 3000 }),
    );
  }));

  it('increaseQty() incrementa qty si no supera el stock efectivo', () => {
    component.product = { ...mockProductDetail }; // quantity: 10
    component.qty = 3;

    component.increaseQty();

    expect(component.qty).toBe(4);
  });

  it('increaseQty() no incrementa qty si ya está al límite de stock', () => {
    component.product = { ...mockProductDetail }; // quantity: 10
    component.qty = 10;

    component.increaseQty();

    expect(component.qty).toBe(10);
  });

  it('decreaseQty() decrementa qty si es mayor que 1', () => {
    component.qty = 3;
    component.decreaseQty();
    expect(component.qty).toBe(2);
  });

  it('decreaseQty() no decrementa qty por debajo de 1', () => {
    component.qty = 1;
    component.decreaseQty();
    expect(component.qty).toBe(1);
  });

  it('onCombinationSelect() asigna selectedCombination cuando todos los atributos están seleccionados', () => {
    const mockComb = {
      id: 5,
      quantity: 3,
      price_impact: 2.5,
      reference: 'COMB-5',
      attributeValues: [{ id: 101 }, { id: 202 }],
    };
    component.combinations = [mockComb];
    component.attributeGroups = [
      { name: 'Talla', values: [{ id: 101, name: 'M' }], selectedValueId: 101 },
      { name: 'Color', values: [{ id: 202, name: 'Rojo' }], selectedValueId: 202 },
    ];

    component.onCombinationSelect();

    expect(component.selectedCombination).toEqual(mockComb);
  });

  it('onCombinationSelect() deja selectedCombination null si no todos los atributos están elegidos', () => {
    component.attributeGroups = [
      { name: 'Talla', values: [{ id: 101, name: 'M' }], selectedValueId: 101 },
      { name: 'Color', values: [{ id: 202, name: 'Rojo' }], selectedValueId: null },
    ];

    component.onCombinationSelect();

    expect(component.selectedCombination).toBeNull();
  });

  it('getCoverImage() devuelve la imagen marcada como cover', () => {
    const images = [
      { id: 1, path: '/img/a.jpg', cover: false },
      { id: 2, path: '/img/b.jpg', cover: true },
    ];
    expect(component.getCoverImage(images as any)).toBe('/img/b.jpg');
  });

  it('getCoverImage() devuelve la primera imagen si ninguna es cover', () => {
    const images = [
      { id: 1, path: '/img/a.jpg', cover: false },
      { id: 2, path: '/img/b.jpg', cover: false },
    ];
    expect(component.getCoverImage(images as any)).toBe('/img/a.jpg');
  });

  it('pone product en null y loading en false cuando getById falla', fakeAsync(async () => {
    const { throwError } = await import('rxjs');
    mockProductService.getById.and.returnValue(throwError(() => new Error('Not found')));

    component.ngOnInit();
    routeParams$.next({ id: '99' });
    await Promise.resolve();

    expect(component.product).toBeNull();
    expect(component.loading).toBeFalse();
  }));
});
