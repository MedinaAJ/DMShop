import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import {
  AnalyticsService,
  AnalyticsSummary,
  RevenuePoint,
  TopProduct,
  TopCategory,
  CustomerPoint,
  Period,
} from './analytics.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    DecimalPipe,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatDividerModule,
  ],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <h1 class="text-2xl font-bold">Analytics</h1>

      <!-- Period buttons -->
      <div class="flex flex-wrap gap-2">
        @for (p of periods; track p.value) {
          <button
            mat-flat-button
            [color]="selectedPeriod() === p.value && !customMode() ? 'primary' : ''"
            (click)="setPeriod(p.value)"
          >{{ p.label }}</button>
        }
      </div>
    </div>

    <!-- Custom date range -->
    <mat-card class="mb-6">
      <mat-card-content class="!pt-4">
        <form class="flex flex-wrap gap-4 items-end" (ngSubmit)="applyCustomRange()">
          <mat-form-field class="w-44" appearance="outline">
            <mat-label>Desde</mat-label>
            <input matInput type="date" [(ngModel)]="dateFrom" name="dateFrom" />
          </mat-form-field>
          <mat-form-field class="w-44" appearance="outline">
            <mat-label>Hasta</mat-label>
            <input matInput type="date" [(ngModel)]="dateTo" name="dateTo" />
          </mat-form-field>
          <button mat-flat-button color="primary" type="submit">Aplicar rango</button>
          @if (customMode()) {
            <button mat-button type="button" (click)="setPeriod('month')">Limpiar</button>
          }
        </form>
      </mat-card-content>
    </mat-card>

    <!-- KPI Cards -->
    @if (loadingSummary()) {
      <div class="flex justify-center py-8"><mat-spinner diameter="40" /></div>
    } @else if (summary()) {
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <mat-card>
          <mat-card-content class="!pt-4">
            <div class="flex items-center gap-2 mb-2">
              <mat-icon class="text-green-500">euro</mat-icon>
              <span class="text-gray-500 text-sm">Ventas totales</span>
            </div>
            <p class="text-2xl font-bold">{{ summary()!.revenue.total | currency:'EUR':'symbol':'1.2-2' }}</p>
            <p class="text-xs text-gray-400 mt-1">Período anterior: {{ summary()!.revenue.previous | currency:'EUR':'symbol':'1.2-2' }}</p>
            <p class="text-sm mt-1"
               [class.text-green-600]="(summary()!.revenue.change_pct ?? 0) >= 0"
               [class.text-red-600]="(summary()!.revenue.change_pct ?? 0) < 0">
              {{ summary()!.revenue.change_pct !== null ? ((summary()!.revenue.change_pct! | number:'1.1-1') + '%') : '—' }}
            </p>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content class="!pt-4">
            <div class="flex items-center gap-2 mb-2">
              <mat-icon class="text-blue-500">shopping_cart</mat-icon>
              <span class="text-gray-500 text-sm">Pedidos</span>
            </div>
            <p class="text-2xl font-bold">{{ summary()!.orders.total }}</p>
            <p class="text-xs text-gray-400 mt-1">Período anterior: {{ summary()!.orders.previous }}</p>
            <p class="text-sm mt-1"
               [class.text-green-600]="(summary()!.orders.change_pct ?? 0) >= 0"
               [class.text-red-600]="(summary()!.orders.change_pct ?? 0) < 0">
              {{ summary()!.orders.change_pct !== null ? ((summary()!.orders.change_pct! | number:'1.1-1') + '%') : '—' }}
            </p>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content class="!pt-4">
            <div class="flex items-center gap-2 mb-2">
              <mat-icon class="text-purple-500">people</mat-icon>
              <span class="text-gray-500 text-sm">Clientes</span>
            </div>
            <p class="text-2xl font-bold">{{ summary()!.customers.new }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ summary()!.customers.returning }} recurrentes</p>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content class="!pt-4">
            <div class="flex items-center gap-2 mb-2">
              <mat-icon class="text-orange-500">receipt</mat-icon>
              <span class="text-gray-500 text-sm">Ticket medio</span>
            </div>
            <p class="text-2xl font-bold">{{ summary()!.avg_order_value.current | currency:'EUR':'symbol':'1.2-2' }}</p>
            <p class="text-xs text-gray-400 mt-1">Ant: {{ summary()!.avg_order_value.previous | currency:'EUR':'symbol':'1.2-2' }}</p>
          </mat-card-content>
        </mat-card>
      </div>
    }

    <!-- Charts row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- Revenue chart -->
      <mat-card>
        <mat-card-header><mat-card-title>Ventas en el tiempo</mat-card-title></mat-card-header>
        <mat-card-content class="!pt-4">
          @if (loadingChart()) {
            <div class="flex justify-center py-8"><mat-spinner diameter="32" /></div>
          } @else {
            <canvas #revenueCanvas height="160"></canvas>
          }
        </mat-card-content>
      </mat-card>

      <!-- Customers chart -->
      <mat-card>
        <mat-card-header><mat-card-title>Nuevos clientes</mat-card-title></mat-card-header>
        <mat-card-content class="!pt-4">
          @if (loadingCustomers()) {
            <div class="flex justify-center py-8"><mat-spinner diameter="32" /></div>
          } @else {
            <canvas #customersCanvas height="160"></canvas>
          }
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Top products (full table) -->
    <mat-card class="mb-8">
      <mat-card-header>
        <mat-card-title>Top 10 productos más vendidos</mat-card-title>
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
                <th class="pb-2 pr-2 w-8">#</th>
                <th class="pb-2 pr-4">Producto</th>
                <th class="pb-2 pr-4 text-right">Unidades</th>
                <th class="pb-2 text-right">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              @for (product of topProducts(); track product.id; let i = $index) {
                <tr class="border-b even:bg-gray-50">
                  <td class="py-2 pr-2 text-gray-400">{{ i + 1 }}</td>
                  <td class="py-2 pr-4">
                    <div class="flex items-center gap-2">
                      @if (product.cover_image) {
                        <img [src]="getImageUrl(product.cover_image)" [alt]="product.name"
                          class="w-9 h-9 rounded object-cover shrink-0" />
                      } @else {
                        <div class="w-9 h-9 rounded bg-gray-100 flex items-center justify-center shrink-0">
                          <mat-icon class="!text-sm text-gray-400">image</mat-icon>
                        </div>
                      }
                      <span class="font-medium">{{ product.name }}</span>
                    </div>
                  </td>
                  <td class="py-2 pr-4 text-right font-medium">{{ product.quantity_sold }}</td>
                  <td class="py-2 text-right font-bold text-green-700">{{ product.revenue | currency:'EUR':'symbol':'1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </mat-card-content>
    </mat-card>

    <!-- Top categories -->
    <mat-card>
      <mat-card-header>
        <mat-card-title>Top categorías por ingresos</mat-card-title>
      </mat-card-header>
      <mat-card-content class="!pt-4">
        @if (loadingCategories()) {
          <div class="flex justify-center py-4"><mat-spinner diameter="32" /></div>
        } @else if (topCategories().length === 0) {
          <p class="text-gray-400 text-sm py-4">Sin datos para este período</p>
        } @else {
          <div class="space-y-4">
            @for (cat of topCategories(); track cat.id; let i = $index) {
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium">{{ i + 1 }}. {{ cat.name }}</span>
                  <span class="text-sm font-bold">{{ cat.revenue | currency:'EUR':'symbol':'1.2-2' }}</span>
                </div>
                <div class="w-full bg-gray-100 rounded h-2">
                  <div class="bg-blue-500 h-2 rounded transition-all"
                    [style.width.%]="getCategoryPct(cat.revenue)"></div>
                </div>
                <p class="text-xs text-gray-400 mt-0.5">{{ cat.orders_count }} pedidos</p>
              </div>
            }
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  @ViewChild('revenueCanvas') revenueCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('customersCanvas') customersCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly analyticsService = inject(AnalyticsService);

  loadingSummary = signal(true);
  summary = signal<AnalyticsSummary | null>(null);

  loadingChart = signal(true);
  revenueData = signal<RevenuePoint[]>([]);

  loadingCustomers = signal(true);
  customersData = signal<CustomerPoint[]>([]);

  loadingProducts = signal(true);
  topProducts = signal<TopProduct[]>([]);

  loadingCategories = signal(true);
  topCategories = signal<TopCategory[]>([]);

  selectedPeriod = signal<Period>('month');
  customMode = signal(false);
  dateFrom = '';
  dateTo = '';

  private revenueChart: any = null;
  private customersChart: any = null;

  periods = [
    { value: 'today' as Period, label: 'Hoy' },
    { value: 'week' as Period, label: 'Semana' },
    { value: 'month' as Period, label: 'Mes' },
    { value: 'year' as Period, label: 'Año' },
  ];

  constructor() {
    this.loadChartJs();
  }

  private async loadChartJs(): Promise<void> {
    if (typeof (window as any)['Chart'] === 'undefined') {
      const chartModule = await import('chart.js');
      const ChartClass = chartModule.Chart;
      if (ChartClass) {
        ChartClass.register(
          chartModule.CategoryScale,
          chartModule.LinearScale,
          chartModule.BarElement,
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
    this.loadAnalytics();
  }

  ngOnDestroy(): void {
    this.revenueChart?.destroy();
    this.customersChart?.destroy();
  }

  setPeriod(period: Period): void {
    this.selectedPeriod.set(period);
    this.customMode.set(false);
    this.loadAnalytics();
  }

  applyCustomRange(): void {
    if (!this.dateFrom || !this.dateTo) return;
    this.customMode.set(true);
    this.loadAnalytics();
  }

  private getParams(): Record<string, string> {
    if (this.customMode() && this.dateFrom && this.dateTo) {
      return { startDate: this.dateFrom, endDate: this.dateTo };
    }
    return { period: this.selectedPeriod() };
  }

  private loadAnalytics(): void {
    const params = this.getParams();

    this.loadingSummary.set(true);
    this.analyticsService.getSummary(params as any).subscribe({
      next: (d) => { this.summary.set(d); this.loadingSummary.set(false); },
      error: () => this.loadingSummary.set(false),
    });

    this.loadingChart.set(true);
    this.analyticsService.getRevenueChart(params as any).subscribe({
      next: (d) => {
        this.revenueData.set(d);
        this.loadingChart.set(false);
        setTimeout(() => this.renderRevenueChart(), 100);
      },
      error: () => this.loadingChart.set(false),
    });

    this.loadingCustomers.set(true);
    this.analyticsService.getCustomersChart(params as any).subscribe({
      next: (d) => {
        this.customersData.set(d);
        this.loadingCustomers.set(false);
        setTimeout(() => this.renderCustomersChart(), 100);
      },
      error: () => this.loadingCustomers.set(false),
    });

    this.loadingProducts.set(true);
    this.analyticsService.getTopProducts({ ...(params as any), limit: 10 }).subscribe({
      next: (d) => { this.topProducts.set(d); this.loadingProducts.set(false); },
      error: () => this.loadingProducts.set(false),
    });

    this.loadingCategories.set(true);
    this.analyticsService.getTopCategories(params as any).subscribe({
      next: (d) => { this.topCategories.set(d); this.loadingCategories.set(false); },
      error: () => this.loadingCategories.set(false),
    });
  }

  private renderRevenueChart(): void {
    const ChartClass = (window as any)['Chart'];
    if (!ChartClass || !this.revenueCanvas?.nativeElement) {
      setTimeout(() => this.renderRevenueChart(), 300);
      return;
    }
    this.revenueChart?.destroy();
    const data = this.revenueData();
    this.revenueChart = new ChartClass(this.revenueCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: data.map((d) => d.date),
        datasets: [{
          label: 'Ventas (€)',
          data: data.map((d) => d.revenue),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.1)',
          fill: true,
          tension: 0.3,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { callback: (v: number) => `€${v}` } },
        },
      },
    });
  }

  private renderCustomersChart(): void {
    const ChartClass = (window as any)['Chart'];
    if (!ChartClass || !this.customersCanvas?.nativeElement) {
      setTimeout(() => this.renderCustomersChart(), 300);
      return;
    }
    this.customersChart?.destroy();
    const data = this.customersData();
    this.customersChart = new ChartClass(this.customersCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: data.map((d) => d.date),
        datasets: [{
          label: 'Nuevos clientes',
          data: data.map((d) => d.new_customers),
          backgroundColor: 'rgba(139,92,246,0.6)',
          borderColor: '#8b5cf6',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
      },
    });
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `/uploads/${path}`;
  }

  getCategoryPct(revenue: number): number {
    const categories = this.topCategories();
    if (!categories.length) return 0;
    const max = categories[0].revenue;
    if (!max) return 0;
    return Math.round((revenue / max) * 100);
  }
}
