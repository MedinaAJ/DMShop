import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ApiService } from '../../core/services/api.service';

interface CartRuleData {
  code: string;
  name: string;
  description: string;
  dateFrom: string;
  dateTo: string;
  quantity: number;
  quantityPerUser: number;
  priority: number;
  minimumAmount: number;
  freeShipping: boolean;
  reductionPercent: number;
  reductionAmount: number;
  reductionCurrency: string;
  idCustomer: number | null;
  active: boolean;
}

@Component({
  selector: 'app-cart-rule-form',
  standalone: true,
  imports: [RouterLink, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSlideToggleModule, MatSnackBarModule, MatProgressSpinnerModule, MatCheckboxModule],
  template: `
    <div class="flex items-center gap-4 mb-6">
      <a mat-icon-button routerLink="/cart-rules"><mat-icon>arrow_back</mat-icon></a>
      <h1 class="text-2xl font-bold">{{ isNew ? 'Nuevo cupón' : 'Editar cupón' }}</h1>
    </div>

    @if (loading) {
      <div class="flex justify-center py-12"><mat-spinner diameter="48" /></div>
    } @else {
      <form (ngSubmit)="onSubmit()" class="max-w-3xl space-y-6">
        <!-- Identificación -->
        <h2 class="text-lg font-semibold text-gray-700">Identificación</h2>
        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Código</mat-label>
            <input matInput [(ngModel)]="rule.code" name="code" placeholder="VERANO25" />
            <mat-hint>Código que el cliente introducirá</mat-hint>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Nombre</mat-label>
            <input matInput [(ngModel)]="rule.name" name="name" required />
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Descripción</mat-label>
          <textarea matInput [(ngModel)]="rule.description" name="description" rows="3"></textarea>
        </mat-form-field>

        <!-- Validez -->
        <h2 class="text-lg font-semibold text-gray-700">Validez</h2>
        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Fecha inicio</mat-label>
            <input matInput type="datetime-local" [(ngModel)]="rule.dateFrom" name="dateFrom" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Fecha fin</mat-label>
            <input matInput type="datetime-local" [(ngModel)]="rule.dateTo" name="dateTo" />
          </mat-form-field>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Usos totales</mat-label>
            <input matInput type="number" [(ngModel)]="rule.quantity" name="quantity" min="0" required />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Usos por cliente</mat-label>
            <input matInput type="number" [(ngModel)]="rule.quantityPerUser" name="quantityPerUser" min="0" required />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Prioridad</mat-label>
            <input matInput type="number" [(ngModel)]="rule.priority" name="priority" min="0" />
          </mat-form-field>
        </div>

        <!-- Condiciones -->
        <h2 class="text-lg font-semibold text-gray-700">Condiciones</h2>
        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Importe mínimo</mat-label>
            <input matInput type="number" [(ngModel)]="rule.minimumAmount" name="minimumAmount" min="0" step="0.01" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Restringir a cliente (ID)</mat-label>
            <input matInput type="number" [(ngModel)]="rule.idCustomer" name="idCustomer" />
            <mat-hint>Dejar vacío para todos</mat-hint>
          </mat-form-field>
        </div>

        <!-- Descuento -->
        <h2 class="text-lg font-semibold text-gray-700">Descuento</h2>
        <div class="grid grid-cols-3 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>% descuento</mat-label>
            <input matInput type="number" [(ngModel)]="rule.reductionPercent" name="reductionPercent" min="0" max="100" step="0.01" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Descuento fijo</mat-label>
            <input matInput type="number" [(ngModel)]="rule.reductionAmount" name="reductionAmount" min="0" step="0.01" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Moneda descuento</mat-label>
            <input matInput [(ngModel)]="rule.reductionCurrency" name="reductionCurrency" placeholder="EUR" />
          </mat-form-field>
        </div>
        <mat-checkbox [(ngModel)]="rule.freeShipping" name="freeShipping" color="primary">
          Envío gratuito
        </mat-checkbox>

        <!-- Estado -->
        <div class="pt-2">
          <mat-slide-toggle [(ngModel)]="rule.active" name="active" color="primary">Activo</mat-slide-toggle>
        </div>

        <div class="flex gap-3 pt-4">
          <button mat-flat-button color="primary" type="submit" [disabled]="saving">
            @if (saving) { <mat-spinner diameter="20" class="inline-block" /> }
            @else { {{ isNew ? 'Crear' : 'Guardar' }} }
          </button>
          <a mat-button routerLink="/cart-rules">Cancelar</a>
        </div>
      </form>
    }
  `,
})
export class CartRuleFormComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  isNew = true;
  loading = false;
  saving = false;
  ruleId: number | null = null;

  rule: CartRuleData = {
    code: '', name: '', description: '', dateFrom: '', dateTo: '',
    quantity: 1, quantityPerUser: 1, priority: 1, minimumAmount: 0,
    freeShipping: false, reductionPercent: 0, reductionAmount: 0,
    reductionCurrency: 'EUR', idCustomer: null, active: true,
  };

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id && id !== 'new') {
      this.isNew = false;
      this.ruleId = +id;
      this.loading = true;
      this.api.get<any>(`/discounts/cart-rules/${id}`).subscribe({
        next: (res: any) => {
          const r = res.data;
          this.rule = {
            code: r.code || '',
            name: r.name,
            description: r.description || '',
            dateFrom: r.dateFrom ? this.toLocalDatetime(r.dateFrom) : '',
            dateTo: r.dateTo ? this.toLocalDatetime(r.dateTo) : '',
            quantity: r.quantity,
            quantityPerUser: r.quantityPerUser,
            priority: r.priority,
            minimumAmount: r.minimumAmount,
            freeShipping: r.freeShipping,
            reductionPercent: r.reductionPercent,
            reductionAmount: r.reductionAmount,
            reductionCurrency: r.reductionCurrency || 'EUR',
            idCustomer: r.idCustomer || null,
            active: r.active,
          };
          this.loading = false;
        },
        error: () => {
          this.snack.open('Cupón no encontrado', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/cart-rules']);
        },
      });
    }
  }

  onSubmit(): void {
    this.saving = true;
    const body: any = { ...this.rule };
    if (!body.code) delete body.code;
    if (!body.dateFrom) delete body.dateFrom;
    if (!body.dateTo) delete body.dateTo;
    if (!body.idCustomer) delete body.idCustomer;

    const request$ = this.isNew
      ? this.api.post<any>('/discounts/cart-rules', body)
      : this.api.put<any>(`/discounts/cart-rules/${this.ruleId}`, body);

    request$.subscribe({
      next: () => {
        this.snack.open(this.isNew ? 'Cupón creado' : 'Cupón guardado', 'OK', { duration: 2000 });
        this.router.navigate(['/cart-rules']);
      },
      error: () => {
        this.snack.open('Error al guardar', 'Cerrar', { duration: 3000 });
        this.saving = false;
      },
    });
  }

  private toLocalDatetime(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
