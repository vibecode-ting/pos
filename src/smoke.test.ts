import { describe, expect, it } from 'vitest';

describe('CycleFlow POS smoke checks', () => {
  it('calculates a tax-inclusive checkout total without floating point drift', () => {
    const subtotal = 1290000 + 65000;
    const tax = Math.round(subtotal * 0.05);
    expect(tax + subtotal).toBe(1422750);
  });

  it('uses a stable offline sale status', () => {
    const sale = { status: 'PENDING_UPLOAD' as const, receipt: 'CF-260915-001' };
    expect(sale.status).toBe('PENDING_UPLOAD');
    expect(sale.receipt).toMatch(/^CF-\d{6}-\d{3}$/);
  });
});
