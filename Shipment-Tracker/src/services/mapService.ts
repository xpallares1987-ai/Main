import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shipment } from '../types';

export class MapService {
  private static instance: L.Map | null = null;
  private static markers: (L.Marker | L.CircleMarker)[] = [];
  private static lines: L.Polyline[] = [];

  static init(containerId: string) {
    this.instance = L.map(containerId, { zoomControl: false }).setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.instance);
  }

  static renderShipments(shipments: Shipment[]) {
    if (!this.instance) return;
    this.clearMap();
    const bounds = L.latLngBounds([]);

    shipments.forEach(s => {
      if (!this.instance) return;
      
      const iconUrl = s.mode === 'air' ? './assets/icons/plane.svg' : 
                      s.mode === 'sea' ? './assets/icons/ship.svg' : 
                      './assets/icons/truck.svg';

      const customIcon = L.icon({
        iconUrl,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
        className: `map-icon-${s.mode}`
      });

      const origin = L.circleMarker(s.originCoords, { 
        radius: 4, 
        color: '#64748b',
        fillColor: '#64748b',
        fillOpacity: 0.5 
      }).addTo(this.instance);

      const dest = L.marker(s.destCoords, { icon: customIcon }).addTo(this.instance)
        .bindPopup(`<b>${s.reference}</b><br>${s.origin} ➔ ${s.destination}<br>Status: ${s.status.toUpperCase()}`);

      const line = L.polyline([s.originCoords, s.destCoords], {
        color: s.mode === 'air' ? '#ec4899' : s.mode === 'sea' ? '#06b6d4' : '#10b981',
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
    if (!this.instance) return;
    this.markers.forEach(m => this.instance?.removeLayer(m));
    this.lines.forEach(l => this.instance?.removeLayer(l));
    this.markers = [];
    this.lines = [];
  }
}



