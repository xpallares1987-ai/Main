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
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const fileName = `shipment_report_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return fileName;
  }
};
