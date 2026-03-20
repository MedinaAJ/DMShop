import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'catalog',
        loadComponent: () =>
          import('./features/catalog/catalog.component').then((m) => m.CatalogComponent),
      },
      {
        path: 'catalog/:categoryId',
        loadComponent: () =>
          import('./features/catalog/catalog.component').then((m) => m.CatalogComponent),
      },
      {
        path: 'product/:id',
        loadComponent: () =>
          import('./features/product/product-detail.component').then(
            (m) => m.ProductDetailComponent,
          ),
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/cart/cart.component').then((m) => m.CartComponent),
      },
      {
        path: 'checkout',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/checkout/checkout.component').then((m) => m.CheckoutComponent),
      },
      {
        path: 'payment/confirmation/:orderId',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/checkout/payment-confirmation.component').then((m) => m.PaymentConfirmationComponent),
      },
      {
        path: 'auth/login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'auth/register',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
      },
      {
        path: 'account',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/account/account.component').then((m) => m.AccountComponent),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/account/dashboard/account-dashboard.component').then(
                (m) => m.AccountDashboardComponent,
              ),
          },
          {
            path: 'addresses',
            loadComponent: () =>
              import('./features/account/addresses/address-list.component').then(
                (m) => m.AddressListComponent,
              ),
          },
          {
            path: 'addresses/new',
            loadComponent: () =>
              import('./features/account/addresses/address-form.component').then(
                (m) => m.AddressFormComponent,
              ),
          },
          {
            path: 'addresses/:id',
            loadComponent: () =>
              import('./features/account/addresses/address-form.component').then(
                (m) => m.AddressFormComponent,
              ),
          },
          {
            path: 'orders',
            loadComponent: () =>
              import('./features/account/orders/order-list.component').then(
                (m) => m.OrderListComponent,
              ),
          },
          {
            path: 'orders/:id',
            loadComponent: () =>
              import('./features/account/orders/order-detail.component').then(
                (m) => m.OrderDetailComponent,
              ),
          },
          {
            path: 'wishlist',
            loadComponent: () =>
              import('./features/account/wishlist/wishlist.component').then(
                (m) => m.WishlistComponent,
              ),
          },
        ],
      },
      {
        path: 'wishlist/shared/:token',
        loadComponent: () =>
          import('./features/account/wishlist/shared-wishlist.component').then(
            (m) => m.SharedWishlistComponent,
          ),
      },
      {
        path: 'compare',
        loadComponent: () =>
          import('./features/catalog/compare.component').then((m) => m.CompareComponent),
      },
      {
        path: 'paginas/:slug',
        loadComponent: () =>
          import('./features/cms/cms-page.component').then((m) => m.CmsPageComponent),
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
