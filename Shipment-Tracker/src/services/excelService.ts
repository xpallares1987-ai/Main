import * as XLSX from 'xlsx';
import { Shipment, Milestone, ShipmentStatus, ShipmentMode } from '../types';

export const ExcelService = {
  async parseShipments(file: File): Promise<Shipment[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet) as Record<string, unknown>[];

          const shipments: Shipment[] = rows.map((row, idx) => ({
            id: (row.id as string) || crypto.randomUUID(),
            reference: String(row.reference || row.Reference || `REF-${idx}`),
            container: String(row.container || row.Container || ''),
            carrier: String(row.carrier || row.Carrier || ''),
            origin: String(row.origin || row.Origin || 'Unknown'),
            destination: String(row.destination || row.Destination || 'Unknown'),
            originCoords: this.parseCoords(row.originCoords || row.OriginCoords, [0, 0]),
            destCoords: this.parseCoords(row.destCoords || row.DestCoords, [0, 0]),
            status: ((row.status as string) || 'transit').toLowerCase() as ShipmentStatus,
            mode: ((row.mode as string) || 'sea').toLowerCase() as ShipmentMode,
            eta: String(row.eta || row.ETA || ''),
            freeTimeDays: Number(row.freeTimeDays || 7),
            demurrageRate: Number(row.demurrageRate || 100),
            milestones: this.parseMilestones(row.milestones),
            notes: [],
            auditHistory: [{
              id: crypto.randomUUID(),
              action: 'IMPORT',
              author: 'Excel',
              timestamp: new Date().toLocaleString(),
              details: 'Importado desde archivo Excel'
            }]
          }));
          resolve(shipments);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },

  parseCoords(val: unknown, fallback: [number, number]): [number, number] {
    if (Array.isArray(val) && val.length === 2) return val as [number, number];
    if (typeof val === 'string') {
      const parts = val.split(',').map(p => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) return [parts[0], parts[1]] as [number, number];
    }
    return fallback;
  },

  parseMilestones(val: unknown): Milestone[] {
    if (Array.isArray(val)) return val as Milestone[];
    // Default milestones if none provided
    return [
      { label: 'Booking', key: 'booking', completed: true },
      { label: 'Transit', key: 'transit', completed: false }
    ];
  }
};
