import { Shipment } from '../types';

declare var L: any;

export class MapService {
  private static instance: any;
  private static markers: any[] = [];
  private static lines: any[] = [];

  static init(containerId: string) {
    this.instance = L.map(containerId, { zoomControl: false }).setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.instance);
  }

  static renderShipments(shipments: Shipment[]) {
    if (!this.instance) return;
    this.clearMap();
    const bounds = L.latLngBounds([]);

    shipments.forEach(s => {
      const origin = L.circleMarker(s.originCoords, { 
        radius: 5, 
        color: '#64748b',
        fillColor: '#64748b',
        fillOpacity: 0.5 
      }).addTo(this.instance);

      const dest = L.circleMarker(s.destCoords, { 
        radius: 7, 
        color: '#06b6d4', // Cyan
        fillColor: '#06b6d4',
        fillOpacity: 0.8 
      }).addTo(this.instance)
        .bindPopup(`<b>${s.reference}</b><br>${s.origin} ➔ ${s.destination}`);

      const line = L.polyline([s.originCoords, s.destCoords], {
        color: s.mode === 'air' ? '#ec4899' : '#06b6d4',
        weight: 2, 
        dashArray: '5, 10', 
        opacity: 0.6
      }).addTo(this.instance);

      this.markers.push(origin, dest);
      this.lines.push(line);
      bounds.extend(s.originCoords);
      bounds.extend(s.destCoords);
    });

    if (shipments.length > 0) {
      this.instance.fitBounds(bounds, { padding: [80, 80] });
    }
  }

  private static clearMap() {
    this.markers.forEach(m => this.instance.removeLayer(m));
    this.lines.forEach(l => this.instance.removeLayer(l));
    this.markers = [];
    this.lines = [];
  }
}

