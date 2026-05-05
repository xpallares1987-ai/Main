import { Shipment } from '../types';
import { I18nService } from './i18nService';
import ApexCharts from 'apexcharts';

let statusChart: ApexCharts | null = null;
let modeChart: ApexCharts | null = null;

export const ChartService = {
  init() {
    const commonOptions = {
      chart: { type: 'donut' as const, height: 250, foreColor: '#94a3b8' },
      stroke: { show: false },
      legend: { position: 'bottom' as const },
      dataLabels: { enabled: false },
      theme: { mode: 'dark' as const }
    };

    statusChart = new ApexCharts(document.querySelector("#statusChart"), {
      ...commonOptions,
      series: [],
      labels: [],
      colors: ['#0ea5e9', '#38bdf8', '#f59e0b', '#10b981']
    });
    statusChart.render();

    modeChart = new ApexCharts(document.querySelector("#modeChart"), {
      ...commonOptions,
      series: [],
      labels: [],
      colors: ['#22d3ee', '#f472b6', '#fbbf24']
    });
    modeChart.render();
  },

  update(shipments: Shipment[]) {
    const t = I18nService.t;
    
    // Status Data
    const statusCounts = {
      booking: shipments.filter(s => s.status === 'booking').length,
      transit: shipments.filter(s => s.status === 'transit').length,
      customs: shipments.filter(s => s.status === 'customs').length,
      delivered: shipments.filter(s => s.status === 'delivered').length
    };

    statusChart?.updateSeries(Object.values(statusCounts));
    statusChart?.updateOptions({ labels: [t.booking, t.transit, t.customs, t.delivered] });

    // Mode Data
    const modeCounts = {
      sea: shipments.filter(s => s.mode === 'sea').length,
      air: shipments.filter(s => s.mode === 'air').length,
      land: shipments.filter(s => s.mode === 'land').length
    };

    modeChart?.updateSeries(Object.values(modeCounts));
    modeChart?.updateOptions({ labels: ['Ocean', 'Air', 'Land'] });
  }
};



