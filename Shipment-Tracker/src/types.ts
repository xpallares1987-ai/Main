export interface Milestone {
  label: string;
  key: string;
  completed: boolean;
  date?: string;
}

export interface Note {
  id: string;
  text: string;
  author: string;
  date: string;
}

export interface AuditLog {
  id: string;
  action: string;
  author: string;
  timestamp: string;
  details: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  region: string;
  email: string;
  phone: string;
  status: 'active' | 'away' | 'offline';
  specialties: string[];
}

export type ShipmentStatus = 'booking' | 'transit' | 'customs' | 'delivered';
export type ShipmentMode = 'sea' | 'air' | 'land';

export interface Shipment {
  id: string;
  reference: string;
  container: string;
  origin: string;
  destination: string;
  originCoords: [number, number];
  destCoords: [number, number];
  status: ShipmentStatus;
  mode: ShipmentMode;
  eta: string;
  milestones: Milestone[];
  portArrivalDate?: string;
  freeTimeDays: number;
  demurrageRate: number;
  notes?: Note[];
  auditHistory?: AuditLog[];
}

export interface ShipmentFilters {
  term: string;
  status: string;
}



