import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/admin-login.component').then((m) => m.AdminLoginComponent),
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/product-list/product-list.component').then(
            (m) => m.ProductListComponent,
          ),
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./features/products/product-form/product-form.component').then(
            (m) => m.ProductFormComponent,
          ),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/category-list/category-list.component').then(
            (m) => m.CategoryListComponent,
          ),
      },
      {
        path: 'manufacturers',
        loadComponent: () =>
          import('./features/manufacturers/manufacturer-list.component').then(
            (m) => m.ManufacturerListComponent,
          ),
      },
      {
        path: 'manufacturers/:id',
        loadComponent: () =>
          import('./features/manufacturers/manufacturer-form.component').then(
            (m) => m.ManufacturerFormComponent,
          ),
      },
      {
        path: 'suppliers',
        loadComponent: () =>
          import('./features/suppliers/supplier-list.component').then(
            (m) => m.SupplierListComponent,
          ),
      },
      {
        path: 'suppliers/:id',
        loadComponent: () =>
          import('./features/suppliers/supplier-form.component').then(
            (m) => m.SupplierFormComponent,
          ),
      },
      {
        path: 'attributes',
        loadComponent: () =>
          import('./features/attributes/attribute-list.component').then(
            (m) => m.AttributeListComponent,
          ),
      },
      {
        path: 'attributes/:id',
        loadComponent: () =>
          import('./features/attributes/attribute-form.component').then(
            (m) => m.AttributeFormComponent,
          ),
      },
      {
        path: 'features',
        loadComponent: () =>
          import('./features/feature-mgmt/feature-list.component').then(
            (m) => m.FeatureListComponent,
          ),
      },
      {
        path: 'features/:id',
        loadComponent: () =>
          import('./features/feature-mgmt/feature-form.component').then(
            (m) => m.FeatureFormComponent,
          ),
      },
      {
        path: 'cart-rules',
        loadComponent: () =>
          import('./features/discounts/cart-rule-list.component').then(
            (m) => m.CartRuleListComponent,
          ),
      },
      {
        path: 'cart-rules/:id',
        loadComponent: () =>
          import('./features/discounts/cart-rule-form.component').then(
            (m) => m.CartRuleFormComponent,
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/order-list/order-list.component').then(
            (m) => m.OrderListComponent,
          ),
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./features/orders/order-detail/order-detail.component').then(
            (m) => m.OrderDetailComponent,
          ),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/customers/customer-list/customer-list.component').then(
            (m) => m.CustomerListComponent,
          ),
      },
      {
        path: 'carriers',
        loadComponent: () =>
          import('./features/carriers/carrier-list.component').then((m) => m.CarrierListComponent),
      },
      {
        path: 'carriers/:id',
        loadComponent: () =>
          import('./features/carriers/carrier-form.component').then((m) => m.CarrierFormComponent),
      },
      {
        path: 'taxes',
        loadComponent: () =>
          import('./features/taxes/tax-list.component').then((m) => m.TaxListComponent),
      },
      {
        path: 'taxes/:id',
        loadComponent: () =>
          import('./features/taxes/tax-form.component').then((m) => m.TaxFormComponent),
      },
      {
        path: 'geo',
        loadComponent: () =>
          import('./features/geo/geo-management.component').then((m) => m.GeoManagementComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
