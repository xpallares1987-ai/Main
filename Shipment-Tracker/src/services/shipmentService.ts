import { Shipment, ShipmentFilters, Note, AuditLog } from '../types';
import { SharedDatabase } from 'shared-utils';

const db = new SharedDatabase('shipment_tracker_db');

const INITIAL_SHIPMENTS: Shipment[] = [
  {
    id: '1', reference: 'HAWB-9921', container: 'MSCU1234567',
    origin: 'Shanghai', destination: 'Barcelona',
    originCoords: [31.2304, 121.4737], destCoords: [41.3851, 2.1734],
    status: 'transit', mode: 'sea', eta: '2026-05-10', freeTimeDays: 7, demurrageRate: 150,
    milestones: [
      { label: 'Booking', key: 'booking', completed: true, date: '2026-04-10' },
      { label: 'En Tránsito', key: 'transit', completed: true, date: '2026-04-18' },
      { label: 'Entregado', key: 'delivered', completed: false }
    ],
    notes: [],
    auditHistory: [
      { id: 'a1', action: 'CREATE', author: 'System', timestamp: '2026-04-10 09:00', details: 'Embarque inicializado' }
    ]
  },
  {
    id: '2', reference: 'AIR-4452', container: 'MAWB-778899',
    origin: 'Frankfurt', destination: 'Mexico City',
    originCoords: [50.1109, 8.6821], destCoords: [19.4326, -99.1332],
    status: 'booking', mode: 'air', eta: '2026-04-20', freeTimeDays: 3, demurrageRate: 50,
    milestones: [
      { label: 'Booking', key: 'booking', completed: true, date: '2026-04-15' },
      { label: 'Salida', key: 'transit', completed: false }
    ],
    notes: [],
    auditHistory: [
      { id: 'a2', action: 'CREATE', author: 'System', timestamp: '2026-04-15 14:30', details: 'Reserva aérea confirmada' }
    ]
  },
  {
    id: '3', reference: 'HAWB-7710', container: 'HLXU1122334',
    origin: 'Ningbo', destination: 'Madrid',
    originCoords: [29.8683, 121.5440], destCoords: [40.4168, -3.7038],
    status: 'customs', mode: 'sea', eta: '2026-04-26', portArrivalDate: '2026-04-20', freeTimeDays: 4, demurrageRate: 120,
    milestones: [
      { label: 'En Puerto', key: 'port', completed: true, date: '2026-04-20' },
      { label: 'Aduanas', key: 'customs', completed: true, date: '2026-04-22' }
    ],
    notes: [],
    auditHistory: [
      { id: 'a3', action: 'UPDATE', author: 'Admin', timestamp: '2026-04-22 11:20', details: 'Ingreso a terminal portuaria' }
    ]
  }
];

const FILTERS_KEY = 'shipment_filters';
const DATA_KEY = 'shipment_data';

export const ShipmentService = {
  async getShipments(): Promise<Shipment[]> {
    return await db.get(DATA_KEY, INITIAL_SHIPMENTS);
  },

  async saveShipments(shipments: Shipment[]) {
    await db.set(DATA_KEY, shipments);
  },

  async addAuditEntry(shipmentId: string, action: string, details: string, author: string = 'Operador') {
    const shipments = await this.getShipments();
    const index = shipments.findIndex(s => s.id === shipmentId);
    if (index !== -1) {
      const entry: AuditLog = {
        id: crypto.randomUUID(),
        action,
        author,
        timestamp: new Date().toLocaleString(),
        details
      };
      if (!shipments[index].auditHistory) shipments[index].auditHistory = [];
      shipments[index].auditHistory!.push(entry);
      await this.saveShipments(shipments);
      return shipments[index];
    }
    return null;
  },

  async addNote(shipmentId: string, text: string, author: string = 'Operador') {
    const shipment = await this.addAuditEntry(shipmentId, 'NOTE_ADDED', `Nota: ${text.substring(0, 20)}...`, author);
    if (!shipment) return null;
    
    const note: Note = {
      id: crypto.randomUUID(),
      text,
      author,
      date: new Date().toLocaleString()
    };
    if (!shipment.notes) shipment.notes = [];
    shipment.notes.push(note);
    
    const shipments = await this.getShipments();
    const idx = shipments.findIndex(s => s.id === shipmentId);
    shipments[idx] = shipment;
    await this.saveShipments(shipments);
    return shipment;
  },

  checkExceptions(s: Shipment) {
    const today = new Date('2026-04-25');
    const eta = new Date(s.eta);
    const exceptions = [];
    if (today > eta && s.status !== 'delivered') exceptions.push({ type: 'delay', message: 'RETRASO' });
    return exceptions;
  },

  filterShipments(shipments: Shipment[], filters: ShipmentFilters): Shipment[] {
    const term = filters.term.toLowerCase();
    return shipments.filter(s => {
      const m = s.reference.toLowerCase().includes(term) || s.origin.toLowerCase().includes(term);
      const ms = filters.status === 'all' || s.status === filters.status;
      return m && ms;
    });
  },

  async saveFilters(filters: ShipmentFilters): Promise<void> { await db.set(FILTERS_KEY, filters); },
  async loadFilters(): Promise<ShipmentFilters | null> { return await db.get(FILTERS_KEY, null); }
};


