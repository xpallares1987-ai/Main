import { Shipment } from '../types';
import { I18nService } from './i18nService';

export const ExportService = {
  exportToCSV(shipments: Shipment[]) {
    const t = I18nService.t;
    
    // Define headers
    const headers = [
      t.reference || 'Reference',
      t.container || 'Container',
      t.status || 'Status',
      t.route || 'Route',
      t.eta || 'ETA'
    ];

    // Map data to rows
    const rows = shipments.map(s => [
      s.reference,
      s.container,
      s.status.toUpperCase(),
      `${s.origin} -> ${s.destination}`,
      s.eta
    ]);

    // Construct CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create download link
    const fileName = `shipment_report_${new Date().toISOString().split('T')[0]}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    this.triggerDownload(url, fileName);
    return fileName;
  },

  exportToJSON(shipments: Shipment[]) {
    const jsonContent = JSON.stringify(shipments, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const fileName = `shipment_report_${new Date().toISOString().split('T')[0]}.json`;
    this.triggerDownload(url, fileName);
    return fileName;
  },

  triggerDownload(url: string, fileName: string) {
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};



