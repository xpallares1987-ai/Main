'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  LayoutDashboard, Ship, Inbox, Package, RefreshCw, Moon, Sun, Search, TrendingUp, BarChart3 
} from 'lucide-react';

type TabType = 'Overview' | 'Boarding' | 'Receptions' | 'Stock';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  const [data, setData] = useState<any[]>([]);
  const [stockData, setStockData] = useState<any[]>([]);
  const [boardingData, setBoardingData] = useState<any[]>([]);
  const [receptionData, setReceptionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const fetchData = async (tab: TabType, forceSync: boolean = false) => {
    if (tab === 'Overview' && !forceSync && (stockData.length > 0)) return;

    setLoading(true);
    setError(null);
    try {
      if (forceSync) {
        throw new Error('La sincronización en tiempo real no está disponible en la versión web estática. Por favor, actualiza desde tu entorno local.');
      }

      // If overview, we might want to fetch all or use existing
      const fetchTab = tab === 'Overview' ? 'Stock' : tab;
      const endpoint = fetchTab === 'Stock' ? 'GetStock' : fetchTab === 'Boarding' ? 'GetBoardingList' : 'GetPendingReceptions';
      
      const response = await fetch(`/api/external-warehouses?action=${endpoint}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      
      if (result.error) throw new Error(result.error);
      const formattedResult = Array.isArray(result) ? result : [];
      
      if (tab === 'Stock') setStockData(formattedResult);
      if (tab === 'Boarding') setBoardingData(formattedResult);
      if (tab === 'Receptions') setReceptionData(formattedResult);
      
      setData(formattedResult);
    } catch (err: any) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  // Specialized effect for Overview to gather multiple data sources
  useEffect(() => {
    if (isMounted && activeTab === 'Overview') {
      const loadOverview = async () => {
        setLoading(true);
        try {
          const [s, b] = await Promise.all([
            fetch('/api/external-warehouses?action=GetStock').then(r => r.json()),
            fetch('/api/external-warehouses?action=GetBoardingList').then(r => r.json())
          ]);
          setStockData(Array.isArray(s) ? s : []);
          setBoardingData(Array.isArray(b) ? b : []);
        } catch (e) {} finally { setLoading(false); }
      };
      loadOverview();
    }
  }, [isMounted, activeTab]);

  useEffect(() => {
    if (isMounted && activeTab !== 'Overview') {
      fetchData(activeTab);
    }
  }, [activeTab, isMounted]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter(item => 
      Object.values(item).some(val => 
        String(val).toLowerCase().includes(lowerSearch)
      )
    );
  }, [data, searchTerm]);

  // Analytics Helpers
  const stockByWarehouse = useMemo(() => {
    const counts: Record<string, number> = {};
    stockData.forEach(item => {
      const wh = item.Warehouse || 'Otros';
      counts[wh] = (counts[wh] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [stockData]);

  const shipmentsByOrigin = useMemo(() => {
    const counts: Record<string, number> = {};
    boardingData.forEach(item => {
      const origin = item.Origin || 'Unknown';
      counts[origin] = (counts[origin] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [boardingData]);

  if (!isMounted) return null;

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="brand">
          <div className="logo-area">
            <BarChart3 className="logo-icon" size={32} />
            <div>
              <h1>Logistics Intelligence</h1>
              <p className="subtitle">Gestión Unificada de Almacenes Externos</p>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <nav className="tabs">
            <button className={`tab-btn ${activeTab === 'Overview' ? 'active' : ''}`} onClick={() => setActiveTab('Overview')}>
              <LayoutDashboard size={18} /> <span>Resumen</span>
            </button>
            <button className={`tab-btn ${activeTab === 'Boarding' ? 'active' : ''}`} onClick={() => setActiveTab('Boarding')}>
              <Ship size={18} /> <span>Embarques</span>
            </button>
            <button className={`tab-btn ${activeTab === 'Receptions' ? 'active' : ''}`} onClick={() => setActiveTab('Receptions')}>
              <Inbox size={18} /> <span>Recepciones</span>
            </button>
            <button className={`tab-btn ${activeTab === 'Stock' ? 'active' : ''}`} onClick={() => setActiveTab('Stock')}>
              <Package size={18} /> <span>Stock</span>
            </button>
          </nav>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </header>

      <section className="controls card">
        <div className="search-wrapper">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            placeholder="Buscar en tiempo real..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
          />
        </div>
        <button onClick={() => fetchData(activeTab, true)} className="refresh-btn" disabled={loading || isSyncing}>
          <RefreshCw className={isSyncing ? 'animate-spin' : ''} size={18} />
          <span>{isSyncing ? 'Sincronizando...' : 'Actualizar Datos'}</span>
        </button>
      </section>

      <main className="content">
        {activeTab === 'Overview' ? (
          <div className="overview-grid">
            <div className="card chart-card">
              <div className="card-header">
                <h3><Package size={18} /> Distribución de Stock por Almacén</h3>
              </div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={stockByWarehouse}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={(props) => {
                        const { name, percent } = props;
                        const safePercent = percent !== undefined && percent !== null ? percent : 0;
                        return `${name} ${(safePercent * 100).toFixed(0)}%`;
                      }}
                    >
                      {stockByWarehouse.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card chart-card">
              <div className="card-header">
                <h3><Ship size={18} /> Embarques por Origen</h3>
              </div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={shipmentsByOrigin}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                    />
                    <Bar dataKey="value" fill="var(--badge-es)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card stats-summary">
              <div className="stat-item">
                <span className="stat-label">Stock Total (Rollos)</span>
                <span className="stat-value">{stockData.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Embarques Activos</span>
                <span className="stat-value">{boardingData.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Proyectos en Monorepo</span>
                <span className="stat-value">3</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="card table-card">
            <div className="card-header">
              <h2>
                {activeTab === 'Stock' && 'Inventario Consolidado'}
                {activeTab === 'Boarding' && 'Lista de Embarques Activos'}
                {activeTab === 'Receptions' && 'Recepciones Pendientes'}
              </h2>
              <div className="stats">
                <span className="badge-count">{filteredData.length} registros</span>
              </div>
            </div>

            <div className="table-responsive">
              <table>
                <thead>
                  {activeTab === 'Boarding' && (
                    <tr>
                      <th style={{ width: '80px' }}>Origen</th>
                      <th>Customer Order</th>
                      <th>Warehouse</th>
                      <th>POL</th>
                      <th>Destination</th>
                      <th>Carga</th>
                      <th>Delivery</th>
                      <th>Arrival</th>
                      <th>Bultos</th>
                      <th>Weight</th>
                      <th>Ext. Addr.</th>
                    </tr>
                  )}
                  {activeTab === 'Receptions' && (
                    <tr>
                      <th style={{ width: '80px' }}>Origen</th>
                      <th>Warehouse</th>
                      <th>Status</th>
                      <th>Load Code</th>
                      <th>Plate</th>
                      <th>Arrival WH</th>
                      <th>Order</th>
                      <th>Description</th>
                      <th>Grammage</th>
                      <th>Weight</th>
                    </tr>
                  )}
                  {activeTab === 'Stock' && (
                    <tr>
                      <th style={{ width: '80px' }}>Origen</th>
                      <th>Warehouse</th>
                      <th>Ext. Addr.</th>
                      <th>Product</th>
                      <th>Item Number</th>
                      <th>Description</th>
                      <th>Grammage</th>
                      <th>Diameter</th>
                      <th>Width</th>
                      <th>Weight</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="skeleton-row">
                        <td colSpan={15}><div className="skeleton-box"></div></td>
                      </tr>
                    ))
                  ) : error ? (
                    <tr><td colSpan={15} style={{ textAlign: 'center', padding: '3rem', color: 'var(--badge-es)' }}>⚠️ {error}</td></tr>
                  ) : filteredData.map((item, idx) => (
                    <tr key={idx}>
                      <td><span className={`origin-badge ${item.Origin === 'ES' ? 'es' : 'fr'}`}>{item.Origin}</span></td>
                      {activeTab === 'Boarding' && (
                        <>
                          <td className="bold">{item['Customer Order']}</td>
                          <td>{item.Warehouse}</td>
                          <td>{item.POL}</td>
                          <td>{item['Final Destination']}</td>
                          <td>{item['Fecha Lim. Carga']}</td>
                          <td>{item['Delivery Date']}</td>
                          <td>{item['Forecast Arrival']}</td>
                          <td>{item.Bultos}</td>
                          <td>{item['Weight (Tons)']}</td>
                          <td>{item['Ext. Addr. Number']}</td>
                        </>
                      )}
                      {activeTab === 'Receptions' && (
                        <>
                          <td>{item.Warehouse}</td>
                          <td>{item.Status}</td>
                          <td className="bold">{item['Load Code']}</td>
                          <td>{item['Plate Number']}</td>
                          <td>{item['Estimated Arrival at WH']}</td>
                          <td>{item['Customer Order']}</td>
                          <td>{item['Product Description']}</td>
                          <td>{item['Grammage (GM)']}</td>
                          <td>{item['Weight (Kgs)']}</td>
                        </>
                      )}
                      {activeTab === 'Stock' && (
                        <>
                          <td>{item.Warehouse}</td>
                          <td>{item['Ext. Addr. Number']}</td>
                          <td>{item['Product Code']}</td>
                          <td className="bold">{item['Item Number']}</td>
                          <td className="text-muted">{item.Description}</td>
                          <td>{item.Grammage}</td>
                          <td>{item.Diameter}</td>
                          <td>{item['Roll Width']}</td>
                          <td>{item.Weight}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .chart-card {
          padding: 1.5rem;
          min-height: 400px;
        }
        .stats-summary {
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          padding: 2rem;
          background: linear-gradient(135deg, var(--card-bg) 0%, var(--bg-main) 100%);
        }
        .stat-item {
          text-align: center;
          padding: 1rem;
        }
        .stat-label {
          display: block;
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
        }
        .stat-value {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--badge-es);
        }
        .logo-area {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .logo-icon {
          color: var(--badge-es);
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        @media (max-width: 768px) {
          .overview-grid {
            grid-template-columns: 1fr;
          }
          .tab-btn span {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
