import { Component, inject } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CompareService } from '../core/services/compare.service';

@Component({
  selector: 'app-compare-bar',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, SlicePipe],
  template: `
    @if (compareService.count() > 0) {
      <div class="fixed bottom-0 left-0 right-0 bg-gray-900 text-white shadow-2xl z-50 py-3 px-6 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <mat-icon class="text-blue-300">compare_arrows</mat-icon>
          <span class="font-medium">Comparando {{ compareService.count() }} de 3 productos</span>
          <div class="flex gap-2 ml-4">
            @for (p of compareService.products(); track p.id) {
              <div class="bg-gray-700 rounded px-2 py-1 text-xs flex items-center gap-1">
                {{ p.name | slice:0:20 }}{{ p.name.length > 20 ? '…' : '' }}
                <button class="ml-1 text-gray-300 hover:text-white" (click)="compareService.remove(p.id)">✕</button>
              </div>
            }
          </div>
        </div>
        <div class="flex gap-3">
          <button mat-stroked-button class="!text-white !border-white" (click)="compareService.clear()">
            Limpiar
          </button>
          <button mat-flat-button color="primary" (click)="goToCompare()">
            Comparar ahora
          </button>
        </div>
      </div>
    }
  `,
})
export class CompareBarComponent {
  readonly compareService = inject(CompareService);
  private readonly router = inject(Router);

  goToCompare(): void {
    this.router.navigate(['/compare'], { queryParams: { ids: this.compareService.getIds().join(',') } });
  }
}
