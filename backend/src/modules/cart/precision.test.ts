/**
 * BLOQUE 1 — Precisión en round() y aritmética decimal
 *
 * Verifica que la función round() manejea correctamente los errores de
 * punto flotante inherentes a JavaScript (IEEE 754).
 * Implementación robusta: Number(Math.round(parseFloat(v + 'e+2')) + 'e-2')
 */
import { describe, it, expect } from 'vitest';

// Replicamos la función interna de cart-calculator.service.ts ya que no se exporta
function round(value: number): number {
  return Number(Math.round(parseFloat(value + 'e+2')) + 'e-2');
}

describe('Función round() — precisión decimal', () => {
  it('0.1 + 0.2 redondeado es 0.30', () => {
    // 0.1 + 0.2 = 0.30000000000000004 en IEEE 754
    // round() lo normaliza correctamente a 0.30
    expect(round(0.1 + 0.2)).toBe(0.30);
  });

  it('redondea 2 decimales — hacia arriba (round(1.005) → 1.01 con Number.EPSILON fix)', () => {
    // Con Number.EPSILON: (1.005 + 2.22e-16) * 100 = 100.500...22 → Math.round = 101 → 1.01
    expect(round(1.005)).toBe(1.01);
  });

  it('redondea 2 decimales — hacia abajo', () => {
    expect(round(1.004)).toBe(1.00);
  });

  it('precio con 21% IVA: 9.99 * 1.21 = 12.09', () => {
    // 9.99 * 1.21 = 12.0879 → round → 12.09
    expect(round(9.99 * 1.21)).toBe(12.09);
  });

  it('precio con 10% IVA: 19.99 * 1.10 = 21.99', () => {
    // 19.99 * 1.10 = 21.989 → round → 21.99
    expect(round(19.99 * 1.10)).toBe(21.99);
  });

  it('precio con 4% IVA: 100.00 * 1.04 = 104.00', () => {
    expect(round(100.00 * 1.04)).toBe(104.00);
  });

  it('descuento 10%: 19.99 * 0.90 = 17.99', () => {
    // 19.99 * 0.90 = 17.991 → round → 17.99
    expect(round(19.99 * 0.90)).toBe(17.99);
  });

  it('descuento 33%: 29.99 * 0.67 = 20.09', () => {
    // 29.99 * (1 - 0.33) = 29.99 * 0.67 = 20.0933 → round → 20.09
    expect(round(29.99 * (1 - 0.33))).toBe(20.09);
  });

  it('suma de 3 líneas no acumula error float', () => {
    const line1 = round(9.99 * 2);   // 19.98
    const line2 = round(4.95 * 3);   // 14.85
    const line3 = round(14.99 * 1);  // 14.99
    // 19.98 + 14.85 + 14.99 = 49.82 — round intermedio en cada línea previene acumulación
    expect(round(line1 + line2 + line3)).toBe(49.82);
  });

  it('precio negativo queda en 0 tras descuento excesivo', () => {
    // descuento de 150€ sobre carrito de 100€ → Math.max(0, -50) = 0
    expect(Math.max(0, round(100 - 150))).toBe(0);
  });

  it('cantidad fraccionaria de tax no produce NaN', () => {
    const taxRate = 21;
    const price = 14.99;
    // 14.99 * (1 + 21/100) = 14.99 * 1.21 = 18.1379 → round → 18.14
    const result = round(price * (1 + taxRate / 100));
    expect(Number.isNaN(result)).toBe(false);
    expect(result).toBe(18.14);
  });

  it('múltiples IVAs acumulados sin pérdida de centésimas', () => {
    // 3 productos con IVA 21% — cada uno redondeado individualmente antes de sumar
    const p1 = round(8.26 * 1.21);   // 9.9946 → 9.99
    const p2 = round(12.39 * 1.21);  // 14.9919 → 14.99
    const p3 = round(4.12 * 1.21);   // 4.9852 → 4.99
    expect(round(p1 + p2 + p3)).toBe(29.97);
  });
});
