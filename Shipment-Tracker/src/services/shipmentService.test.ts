import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShipmentService } from './shipmentService';

describe('ShipmentService', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  it('should return initial shipments when localStorage is empty', () => {
    const shipments = ShipmentService.getShipments();
    expect(shipments.length).toBeGreaterThan(0);
  });

  it('should filter shipments by status', () => {
    const all = ShipmentService.getShipments();
    const filtered = ShipmentService.filterShipments(all, { term: '', status: 'transit' });
    expect(filtered.every(s => s.status === 'transit')).toBe(true);
  });
});


