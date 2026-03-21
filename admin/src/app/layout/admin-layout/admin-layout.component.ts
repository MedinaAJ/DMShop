import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDivider } from '@angular/material/divider';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

interface MenuGroup {
  key: string;
  label: string;
  icon: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDivider,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0', opacity: 0 })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', animate('250ms cubic-bezier(0.4, 0, 0.2, 1)')),
    ]),
    trigger('rotateIcon', [
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      state('expanded', style({ transform: 'rotate(180deg)' })),
      transition('collapsed <=> expanded', animate('200ms cubic-bezier(0.4, 0, 0.2, 1)')),
    ]),
  ],
})
export class AdminLayoutComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly sidenavOpen = signal(true);
  readonly expandedGroups = signal<Record<string, boolean>>({});

  readonly topItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Analytics', icon: 'bar_chart', route: '/analytics' },
  ];

  readonly menuGroups: MenuGroup[] = [
    {
      key: 'catalog',
      label: 'Catálogo',
      icon: 'storefront',
      items: [
        { label: 'Productos', icon: 'inventory_2', route: '/products' },
        { label: 'Categorías', icon: 'category', route: '/categories' },
        { label: 'Fabricantes', icon: 'factory', route: '/manufacturers' },
        { label: 'Proveedores', icon: 'local_shipping', route: '/suppliers' },
        { label: 'Atributos', icon: 'palette', route: '/attributes' },
        { label: 'Características', icon: 'tune', route: '/features' },
      ],
    },
    {
      key: 'sales',
      label: 'Ventas',
      icon: 'shopping_cart',
      items: [
        { label: 'Pedidos', icon: 'receipt_long', route: '/orders' },
        { label: 'Estados de pedido', icon: 'flag', route: '/order-states' },
        { label: 'Descuentos', icon: 'local_offer', route: '/cart-rules' },
        { label: 'Devoluciones', icon: 'assignment_return', route: '/returns' },
        { label: 'Transportistas', icon: 'airport_shuttle', route: '/carriers' },
      ],
    },
    {
      key: 'customers',
      label: 'Clientes',
      icon: 'people',
      items: [
        { label: 'Clientes', icon: 'person', route: '/customers' },
        { label: 'Grupos de clientes', icon: 'group_work', route: '/customer-groups' },
        { label: 'Reseñas', icon: 'rate_review', route: '/reviews' },
      ],
    },
    {
      key: 'config',
      label: 'Configuración',
      icon: 'settings',
      items: [
        { label: 'Impuestos', icon: 'account_balance', route: '/taxes' },
        { label: 'Geográfico', icon: 'public', route: '/geo' },
        { label: 'Idiomas', icon: 'translate', route: '/languages' },
        { label: 'Pagos', icon: 'payment', route: '/payment-settings' },
        { label: 'Email (SMTP)', icon: 'email', route: '/email-settings' },
      ],
    },
    {
      key: 'content',
      label: 'Contenido',
      icon: 'article',
      items: [
        { label: 'Páginas CMS', icon: 'description', route: '/cms' },
      ],
    },
  ];

  ngOnInit(): void {
    this.expandGroupForCurrentRoute(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.expandGroupForCurrentRoute(e.urlAfterRedirects));
  }

  toggleGroup(key: string): void {
    this.expandedGroups.update((groups) => ({ ...groups, [key]: !groups[key] }));
  }

  isGroupExpanded(key: string): boolean {
    return !!this.expandedGroups()[key];
  }

  private expandGroupForCurrentRoute(url: string): void {
    for (const group of this.menuGroups) {
      if (group.items.some((item) => url.startsWith(item.route))) {
        this.expandedGroups.update((groups) => ({ ...groups, [group.key]: true }));
        break;
      }
    }
  }
}
