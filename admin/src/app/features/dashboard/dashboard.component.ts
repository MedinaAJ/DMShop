import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  ElementRef,
  ViewChild,
  AfterViewInit,
  effect,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { ProductStockService, StockAlert } from '../products/product-stock.service';
import { AnalyticsService, AnalyticsSummary, RevenuePoint, TopProduct, TopCategory, Period } from '../analytics/analytics.service';

// Chart.js (vanilla API to avoid type issues)
declare const Chart: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    DecimalPipe,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatTableModule,
    FormsModule,
  ],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <!-- Period selector -->
      <div class="flex gap-2">
        @for (p of periods; track p.value) {
          <button
            mat-flat-button
            [color]="selectedPeriod() === p.value ? 'primary' : ''"
            (click)="setPeriod(p.value)"
          >{{ p.label }}</button>
        }
      </div>
    </div>

    <!-- KPI Cards -->
    @if (loadingSummary()) {
      <div class="flex justify-center py-8">
        <mat-spinner diameter="40" />
      </div>
    } @else if (summary()) {
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Revenue -->
        <mat-card>
          <mat-card-content class="!pt-4">
            <div class="flex items-center gap-3 mb-2">
              <mat-icon class="!text-3xl text-green-500">euro</mat-icon>
              <span class="text-gray-500 text-sm">Ventas del período</span>
            </div>
            <p class="text-2xl font-bold">{{ summary()!.revenue.total | currency:'EUR':'symbol':'1.2-2' }}</p>
            <p class="text-sm mt-1" [class.text-green-600]="(summary()!.revenue.change_pct ?? 0) >= 0" [class.text-red-600]="(summary()!.revenue.change_pct ?? 0) < 0">
              <mat-icon class="!text-sm !w-4 !h-4 align-middle">
                {{ (summary()!.revenue.change_pct ?? 0) >= 0 ? 'trending_up' : 'trending_down' }}
              </mat-icon>
              {{ summary()!.revenue.change_pct !== null ? ((summary()!.revenue.change_pct! | number:'1.1-1') + '%') : '—' }}
              vs período anterior
            </p>
          </mat-card-content>
        </mat-card>

        <!-- Orders -->
        <mat-card>
          <mat-card-content class="!pt-4">
            <div class="flex items-center gap-3 mb-2">
              <mat-icon class="!text-3xl text-blue-500">shopping_cart</mat-icon>
              <span class="text-gray-500 text-sm">Pedidos</span>
            </div>
            <p class="text-2xl font-bold">{{ summary()!.orders.total }}</p>
            <p class="text-sm mt-1" [class.text-green-600]="(summary()!.orders.change_pct ?? 0) >= 0" [class.text-red-600]="(summary()!.orders.change_pct ?? 0) < 0">
              <mat-icon class="!text-sm !w-4 !h-4 align-middle">
                {{ (summary()!.orders.change_pct ?? 0) >= 0 ? 'trending_up' : 'trending_down' }}
              </mat-icon>
              {{ summary()!.orders.change_pct !== null ? ((summary()!.orders.change_pct! | number:'1.1-1') + '%') : '—' }}
              vs período anterior
            </p>
          </mat-card-content>
        </mat-card>

        <!-- New customers -->
        <mat-card>
          <mat-card-content class="!pt-4">
            <div class="flex items-center gap-3 mb-2">
              <mat-icon class="!text-3xl text-purple-500">person_add</mat-icon>
              <span class="text-gray-500 text-sm">Clientes nuevos</span>
            </div>
            <p class="text-2xl font-bold">{{ summary()!.customers.new }}</p>
            <p class="text-sm text-gray-500 mt-1">{{ summary()!.customers.returning }} recurrentes</p>
          </mat-card-content>
        </mat-card>

        <!-- Avg order value -->
        <mat-card>
          <mat-card-content class="!pt-4">
            <div class="flex items-center gap-3 mb-2">
              <mat-icon class="!text-3xl text-orange-500">receipt</mat-icon>
              <span class="text-gray-500 text-sm">Ticket medio</span>
            </div>
            <p class="text-2xl font-bold">{{ summary()!.avg_order_value.current | currency:'EUR':'symbol':'1.2-2' }}</p>
            <p class="text-sm text-gray-500 mt-1">Ant: {{ summary()!.avg_order_value.previous | currency:'EUR':'symbol':'1.2-2' }}</p>
          </mat-card-content>
        </mat-card>
      </div>
    }

    <!-- Revenue Chart + Top Categories -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- Revenue Chart -->
      <mat-card class="lg:col-span-2">
        <mat-card-header>
          <mat-card-title>Ventas por período</mat-card-title>
        </mat-card-header>
        <mat-card-content class="!pt-4">
          @if (loadingChart()) {
            <div class="flex justify-center py-8"><mat-spinner diameter="32" /></div>
          } @else {
            <canvas #revenueCanvas height="120"></canvas>
          }
        </mat-card-content>
      </mat-card>

      <!-- Top Categories -->
      <mat-card>
        <mat-card-header>
          <mat-card-title>Top categorías</mat-card-title>
        </mat-card-header>
        <mat-card-content class="!pt-4">
          @if (loadingCategories()) {
            <div class="flex justify-center py-4"><mat-spinner diameter="32" /></div>
          } @else if (topCategories().length === 0) {
            <p class="text-gray-400 text-sm py-4">Sin datos para este período</p>
          } @else {
            <div class="space-y-3">
              @for (cat of topCategories(); track cat.id) {
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium truncate flex-1 mr-2">{{ cat.name }}</span>
                  <span class="text-sm font-bold text-green-600 shrink-0">
                    {{ cat.revenue | currency:'EUR':'symbol':'1.2-2' }}
                  </span>
                </div>
              }
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Top Products -->
    <mat-card class="mb-8">
      <mat-card-header>
        <mat-card-title>Top productos</mat-card-title>
        <div class="flex-1"></div>
        <a mat-button color="primary" routerLink="/analytics">Ver todos →</a>
      </mat-card-header>
      <mat-card-content class="!pt-2">
        @if (loadingProducts()) {
          <div class="flex justify-center py-4"><mat-spinner diameter="32" /></div>
        } @else if (topProducts().length === 0) {
          <p class="text-gray-400 text-sm py-4">Sin datos para este período</p>
        } @else {
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left text-gray-500">
                <th class="pb-2 pr-4">Producto</th>
                <th class="pb-2 pr-4 text-right">Unidades</th>
                <th class="pb-2 text-right">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              @for (product of topProducts().slice(0, 5); track product.id) {
                <tr class="border-b even:bg-gray-50">
                  <td class="py-2 pr-4">
                    <div class="flex items-center gap-2">
                      @if (product.cover_image) {
                        <img [src]="getImageUrl(product.cover_image)" [alt]="product.name"
                          class="w-8 h-8 rounded object-cover shrink-0" />
                      } @else {
                        <div class="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                          <mat-icon class="!text-sm text-gray-400">image</mat-icon>
                        </div>
                      }
                      <span class="font-medium truncate">{{ product.name }}</span>
                    </div>
                  </td>
                  <td class="py-2 pr-4 text-right">{{ product.quantity_sold }}</td>
                  <td class="py-2 text-right font-semibold">{{ product.revenue | currency:'EUR':'symbol':'1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </mat-card-content>
    </mat-card>

    <!-- Widget: Stock bajo -->
    <mat-card>
      <mat-card-header>
        <mat-card-title class="flex items-center gap-2">
          <mat-icon class="text-orange-500">warning</mat-icon>
          Stock bajo
        </mat-card-title>
      </mat-card-header>
      <mat-card-content class="!pt-4">
        @if (loadingAlerts()) {
          <div class="flex justify-center py-4">
            <mat-spinner diameter="32" />
          </div>
        } @else if (stockAlerts().length === 0) {
          <div class="flex items-center gap-2 text-green-600 py-4">
            <mat-icon>check_circle</mat-icon>
            <span>Todo el stock está bien ✓</span>
          </div>
        } @else {
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left text-gray-500">
                <th class="pb-2 pr-4">Producto</th>
                <th class="pb-2 pr-4">Referencia</th>
                <th class="pb-2 pr-4">Stock actual</th>
                <th class="pb-2 pr-4">Alerta en</th>
                <th class="pb-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              @for (alert of stockAlerts(); track alert.id) {
                <tr class="border-b even:bg-gray-50">
                  <td class="py-2 pr-4 font-medium">{{ alert.name }}</td>
                  <td class="py-2 pr-4 text-gray-400">{{ alert.reference || '—' }}</td>
                  <td class="py-2 pr-4">
                    <span
                      class="px-2 py-0.5 rounded font-semibold"
                      [class.bg-red-100]="alert.quantity === 0"
                      [class.text-red-700]="alert.quantity === 0"
                      [class.bg-orange-100]="alert.quantity > 0"
                      [class.text-orange-700]="alert.quantity > 0"
                    >{{ alert.quantity }}</span>
                  </td>
                  <td class="py-2 pr-4 text-gray-500">≤ {{ alert.lowStockAlert }}</td>
                  <td class="py-2">
                    <a mat-button color="primary" [routerLink]="['/products', alert.id]">
                      <mat-icon class="!text-sm">edit</mat-icon> Editar
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('revenueCanvas') revenueCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly stockService = inject(ProductStockService);
  private readonly analyticsService = inject(AnalyticsService);

  loadingAlerts = signal(true);
  stockAlerts = signal<StockAlert[]>([]);

  loadingSummary = signal(true);
  summary = signal<AnalyticsSummary | null>(null);

  loadingChart = signal(true);
  revenueData = signal<RevenuePoint[]>([]);

  loadingProducts = signal(true);
  topProducts = signal<TopProduct[]>([]);

  loadingCategories = signal(true);
  topCategories = signal<TopCategory[]>([]);

  selectedPeriod = signal<Period>('month');

  private chartInstance: any = null;

  periods = [
    { value: 'today' as Period, label: 'Hoy' },
    { value: 'week' as Period, label: 'Semana' },
    { value: 'month' as Period, label: 'Mes' },
    { value: 'year' as Period, label: 'Año' },
  ];

  private apiUrl = '';

  constructor() {
    // Load chart.js dynamically
    this.loadChartJs();
  }

  private async loadChartJs(): Promise<void> {
    if (typeof (window as any)['Chart'] === 'undefined') {
      // Use dynamic import, chart.js exports Chart as a named export
      const chartModule = await import('chart.js');
      const ChartClass = chartModule.Chart;
      if (ChartClass) {
        ChartClass.register(
          chartModule.CategoryScale,
          chartModule.LinearScale,
          chartModule.PointElement,
          chartModule.LineElement,
          chartModule.Title,
          chartModule.Tooltip,
          chartModule.Legend,
          chartModule.Filler,
        );
        (window as any)['Chart'] = ChartClass;
      }
    }
  }

  ngOnInit(): void {
    this.stockService.getAlerts().subscribe({
      next: (alerts: StockAlert[]) => {
        this.stockAlerts.set(alerts);
        this.loadingAlerts.set(false);
      },
      error: () => {
        this.loadingAlerts.set(false);
      },
    });

    this.loadAnalytics();
  }

  ngAfterViewInit(): void {
    // Chart will be rendered when data arrives
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  setPeriod(period: Period): void {
    this.selectedPeriod.set(period);
    this.loadAnalytics();
  }

  private loadAnalytics(): void {
    const period = this.selectedPeriod();

    this.loadingSummary.set(true);
    this.analyticsService.getSummary({ period }).subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loadingSummary.set(false);
      },
      error: () => this.loadingSummary.set(false),
    });

    this.loadingChart.set(true);
    this.analyticsService.getRevenueChart({ period }).subscribe({
      next: (data) => {
        this.revenueData.set(data);
        this.loadingChart.set(false);
        setTimeout(() => this.renderChart(), 100);
      },
      error: () => this.loadingChart.set(false),
    });

    this.loadingProducts.set(true);
    this.analyticsService.getTopProducts({ period, limit: 10 }).subscribe({
      next: (data) => {
        this.topProducts.set(data);
        this.loadingProducts.set(false);
      },
      error: () => this.loadingProducts.set(false),
    });

    this.loadingCategories.set(true);
    this.analyticsService.getTopCategories({ period }).subscribe({
      next: (data) => {
        this.topCategories.set(data);
        this.loadingCategories.set(false);
      },
      error: () => this.loadingCategories.set(false),
    });
  }

  private renderChart(): void {
    if (!this.revenueCanvas?.nativeElement) return;

    const ChartClass = (window as any)['Chart'];
    if (!ChartClass) {
      // Retry after chart.js loads
      setTimeout(() => this.renderChart(), 300);
      return;
    }

    this.destroyChart();

    const data = this.revenueData();
    const labels = data.map((d) => d.date);
    const revenues = data.map((d) => d.revenue);

    this.chartInstance = new ChartClass(this.revenueCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Ventas (€)',
            data: revenues,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => `€${ctx.parsed.y.toFixed(2)}`,
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: { callback: (v: number) => `€${v}` },
          },
        },
      },
    });
  }

  private destroyChart(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  getImageUrl(path: string): string {
    // Use the environment's upload path
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `/uploads/${path}`;
  }
}
