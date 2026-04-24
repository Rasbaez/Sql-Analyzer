// 💻 src/App.js

import React from 'react';
import { useApp } from './context/AppContext';
import Sidebar from './components/Sidebar'; 
import SqlAnalyzer from './components/SqlAnalyzer';
import RouteAnalyzer from './components/RouteAnalyzer'; 
import TelemetryAnalyzer from './components/TelemetryAnalyzer';
import InvoiceAnalyzer from './components/InvoiceAnalyzer'; 
import AutomationManager from './components/AutomationManager'; 
import Toast from './components/Toast';
import MongoInvoiceAnalyzer from './components/MongoInvoiceAnalyzer'; 
import MongoEodAnalyzer from './components/MongoEodAnalyzer'; 
import './App.css';
import PriceAnalyzer from './components/PriceAnalyzer';


/**
 * Componente raiz da aplicação
 * Usa contexto global para estado compartilhado
 */
function AppContent() {
  const { activeMenu, sidebarCollapsed, toggleSidebar } = useApp();

  return (
    <div className={`app-master-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      
      {/* 🧭 MENU LATERAL MODULARIZADO */}
      <Sidebar 
        onToggleCollapse={toggleSidebar}
      />

      {/* 📺 ÁREA DE CONTEÚDO PRINCIPAL */}
      <main className="main-content">
        
        <div style={{ display: activeMenu === 'connection' ? 'block' : 'none', height: '100%', overflow: 'hidden' }}>
          {/* ConnectionSetup - placeholder */}
        </div>

        <div style={{ display: activeMenu === 'sql' ? 'block' : 'none', height: '100%', overflow: 'hidden' }}>
          <SqlAnalyzer />
        </div>
        
        <div style={{ display: activeMenu === 'route' ? 'block' : 'none', height: '100%', overflow: 'hidden' }}>
          <RouteAnalyzer />
        </div>

        <div style={{ display: activeMenu === 'telemetry' ? 'block' : 'none', height: '100%', overflow: 'hidden' }}>
          <TelemetryAnalyzer />
        </div>

        <div style={{ display: activeMenu === 'invoice' ? 'block' : 'none', height: '100%', overflow: 'hidden' }}>
          <InvoiceAnalyzer />
        </div>

        {/* 🔥 RENDERIZAMOS O PAINEL DO MONGO INVOICE AQUI */}
        <div style={{ display: activeMenu === 'mongo-invoice' ? 'block' : 'none', height: '100%', overflow: 'hidden' }}>
          <MongoInvoiceAnalyzer />
        </div>

        {/* 🔥 NOVO: RENDERIZAMOS O PAINEL DO MONGO EOD AQUI */}
        <div style={{ display: activeMenu === 'mongo-analyzer' ? 'block' : 'none', height: '100%', overflow: 'hidden' }}>
          <MongoEodAnalyzer />
        </div>

        {/* 🔥 RENDERIZAMOS O PAINEL DO HYPERCARE AQUI */}
        <div style={{ display: activeMenu === 'automation' ? 'block' : 'none', height: '100%', overflow: 'hidden' }}>
          <AutomationManager />
        </div>
        
        {/* 🔥 PAINEL DO ANALISADOR DE PREÇOS */}
        <div style={{ display: activeMenu === 'prices' ? 'block' : 'none', height: '100%', overflow: 'hidden' }}>
          <PriceAnalyzer />
        </div>
        
        {activeMenu === 'inventory' && (
          <div className="coming-soon-wrapper">
            <h2>Módulo de Inventário</h2>
            <p>Em desenvolvimento...</p>
          </div>
        )}
      </main>

      {/* 🔔 TOAST GLOBAL */}
      <Toast />
    </div>
  );
}

export default AppContent;