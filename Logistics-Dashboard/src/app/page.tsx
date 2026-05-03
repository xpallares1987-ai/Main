'use client';

import { useState, useEffect, useMemo } from 'react';

type TabType = 'Boarding' | 'Receptions' | 'Stock';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('Boarding');
  const [data, setData] = useState<any[]>([]);
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
    fetchLastSync();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const fetchLastSync = async () => {
    // La sincronización mediante API no está disponible en el despliegue estático
    setLastSync(null);
  };

  const fetchData = async (tab: TabType, forceSync: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      if (forceSync) {
        // En despliegue estático de GitHub Pages, la sincronización en tiempo real no es posible
        throw new Error('La sincronización en tiempo real no está disponible en la versión web estática. Por favor, actualiza desde tu entorno local.');
      }

      const endpoint = tab === 'Stock' ? 'GetStock' : tab === 'Boarding' ? 'GetBoardingList' : 'GetPendingReceptions';
      const response = await fetch(`/api/external-warehouses?action=${endpoint}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      
      if (result.error) throw new Error(result.error);
      setData(Array.isArray(result) ? result : []);
    } catch (err: any) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
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

  if (!isMounted) return null;

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="brand">
          <h1>Logistics Intelligence</h1>
          <p className="subtitle">Gestión Unificada de Almacenes Externos</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <nav className="tabs">
            <button className={`tab-btn ${activeTab === 'Boarding' ? 'active' : ''}`} onClick={() => setActiveTab('Boarding')}>🚢 Embarques</button>
            <button className={`tab-btn ${activeTab === 'Receptions' ? 'active' : ''}`} onClick={() => setActiveTab('Receptions')}>📥 Recepciones</button>
            <button className={`tab-btn ${activeTab === 'Stock' ? 'active' : ''}`} onClick={() => setActiveTab('Stock')}>📦 Stock</button>
          </nav>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {lastSync && (
        <div className="last-sync-info">
          Última sincronización: {new Date(lastSync).toLocaleString()}
        </div>
      )}

      <section className="controls card">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
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
          {isSyncing ? '⌛ Sincronizando...' : '🔄 Actualizar Datos'}
        </button>
      </section>

      <main className="content">
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
      </main>
    </div>
  );
}
