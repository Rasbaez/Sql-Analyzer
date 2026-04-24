// 💻 src/components/Sidebar.js
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, DatabaseZap, Moon, FileSpreadsheet } from 'lucide-react'; // 🔥 Importei o FileSpreadsheet
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import ReactCountryFlag from "react-country-flag";

const Sidebar = ({ onToggleCollapse }) => {
  const { activeMenu, switchMenu, sidebarCollapsed } = useApp();
  const { i18n } = useTranslation();
  
  // Estados para controlar quais "pastas" estão abertas
  const [isLogsOpen, setIsLogsOpen] = useState(true);
  const [isMongoOpen, setIsMongoOpen] = useState(false); 
  const [isAutomationOpen, setIsAutomationOpen] = useState(false); // 🔥 Novo estado pro submenu de automação

  const flagStyle = { width: '1.5em', height: '1.5em', borderRadius: '50%', objectFit: 'cover' };

  return (
    <aside className="sidebar-menu">
      <div className="sidebar-header">
        {!sidebarCollapsed && (
          <div className="brand-titles">
            <h2>MC1 Suporte</h2>
            <span className="subtitle">Enterprise Edition</span>
          </div>
        )}

        {!sidebarCollapsed && (
          <div className="modern-lang-selector">
            <button onClick={() => i18n.changeLanguage('pt')} className={i18n.language === 'pt' ? 'active' : ''} title="Português">
              <ReactCountryFlag countryCode="BR" svg style={flagStyle} />
            </button>
            <button onClick={() => i18n.changeLanguage('es')} className={i18n.language === 'es' ? 'active' : ''} title="Español">
              <ReactCountryFlag countryCode="ES" svg style={flagStyle} />
            </button>
            <button onClick={() => i18n.changeLanguage('en')} className={i18n.language === 'en' ? 'active' : ''} title="English">
              <ReactCountryFlag countryCode="US" svg style={flagStyle} />
            </button>
          </div>
        )}
        
        <button 
          className="collapse-toggle" 
          onClick={onToggleCollapse}
          title={sidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
        >
          {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <button 
          className={activeMenu === 'sql' ? 'active' : ''} 
          onClick={() => switchMenu('sql')}
          title="Corretor SQL"
        >
          {sidebarCollapsed ? '🛠️' : '🛠️ Corretor SQL'}
        </button>

        <button 
          className={activeMenu === 'route' ? 'active' : ''} 
          onClick={() => switchMenu('route')}
          title="Diagnóstico de Rota"
        >
          {sidebarCollapsed ? '📍' : '📍 Diagnóstico de Rota'}
        </button>
        
        <button className={activeMenu === 'prices' ? 'active' : ''} onClick={() => switchMenu('prices')} title="Análise de Preços">
          {sidebarCollapsed ? '💰' : '💰 Análise de Preços'}
        </button>
        
        {/* 📁 SUBMENU: ENGENHARIA DE LOGS */}
        <div className="submenu-wrapper">
          <button 
            className={`submenu-parent ${activeMenu === 'telemetry' || activeMenu === 'invoice' ? 'active-parent' : ''}`}
            onClick={() => setIsLogsOpen(!isLogsOpen)}
            title="Engenharia de Logs"
          >
            <span>{sidebarCollapsed ? '📁' : '📁 Engenharia de Logs'}</span>
            {!sidebarCollapsed && (isLogsOpen ? <ChevronDown size={16} /> : <ChevronLeft size={16} />)}
          </button>

          {isLogsOpen && (
            <div className="submenu-items">
              <button className={activeMenu === 'telemetry' ? 'active' : ''} onClick={() => switchMenu('telemetry')} title="Telemetria (WTM)">
                {sidebarCollapsed ? '📟' : '📟 Telemetria (WTM)'}
              </button>

              <button className={activeMenu === 'invoice' ? 'active' : ''} onClick={() => switchMenu('invoice')} title="Notas Fiscais (DEBUG)">
                {sidebarCollapsed ? '🧾' : '🧾 Notas Fiscais (DEBUG)'}
              </button>
            </div>
          )}
        </div>

       {/* 🍃 SUBMENU: MONGODB */}
        <div className="submenu-wrapper">
          <button 
            className={`submenu-parent ${activeMenu === 'mongo-invoice' || activeMenu === 'mongo-analyzer' ? 'active-parent' : ''}`}
            onClick={() => setIsMongoOpen(!isMongoOpen)}
            title="Consultas MongoDB"
          >
            <span>{sidebarCollapsed ? '🍃' : '🍃 MongoDB'}</span>
            {!sidebarCollapsed && (isMongoOpen ? <ChevronDown size={16} /> : <ChevronLeft size={16} />)}
          </button>

          {isMongoOpen && (
            <div className="submenu-items">
              <button className={activeMenu === 'mongo-invoice' ? 'active' : ''} onClick={() => switchMenu('mongo-invoice')} title="Invoice Analyzer (Notas Fiscais)">
                {sidebarCollapsed ? '🧾' : '🧾 Invoice Analyzer'}
              </button>
              
              <button className={activeMenu === 'mongo-analyzer' ? 'active' : ''} onClick={() => switchMenu('mongo-analyzer')} title="EOD Analyzer (Validador de Fechamento)">
                {sidebarCollapsed ? <Moon size={16} color="#f8fafc" /> : <><Moon size={16} color="#f8fafc" style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} /> EOD Analyzer</>}
              </button>
            </div>
          )}
        </div>

        {/* 🤖 NOVO SUBMENU: AUTOMAÇÃO */}
        <div className="submenu-wrapper">
          <button 
            className={`submenu-parent ${activeMenu === 'automation' || activeMenu === 'massive-extractor' ? 'active-parent' : ''}`}
            onClick={() => setIsAutomationOpen(!isAutomationOpen)}
            title="Automação & Processos"
          >
            <span>{sidebarCollapsed ? '🤖' : '🤖 Automação'}</span>
            {!sidebarCollapsed && (isAutomationOpen ? <ChevronDown size={16} /> : <ChevronLeft size={16} />)}
          </button>

          {isAutomationOpen && (
            <div className="submenu-items">
              <button className={activeMenu === 'automation' ? 'active' : ''} onClick={() => switchMenu('automation')} title="Automação Hypercare">
                {sidebarCollapsed ? '⚡' : '⚡ Hypercare WTM'}
              </button>
              
              <button className={activeMenu === 'massive-extractor' ? 'active' : ''} onClick={() => switchMenu('massive-extractor')} title="Extrator Massive Invoice">
                {sidebarCollapsed ? (
                    <FileSpreadsheet size={16} color="#f8fafc" /> 
                ) : (
                    <>
                      <FileSpreadsheet size={16} color="#f8fafc" style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} /> 
                      Extrator Massivo (NF)
                    </>
                )}
              </button>
            </div>
          )}
        </div>

        <button 
          className={activeMenu === 'inventory' ? 'active' : ''} 
          onClick={() => switchMenu('inventory')}
          title="Inventário"
        >
          {sidebarCollapsed ? '📦' : '📦 Inventário (Em breve)'}
        </button>
      </nav>

      {!sidebarCollapsed && (
        <div className="sidebar-footer">
          <span className="status-dot"></span>
          Pronto para uso
        </div>
      )}
    </aside>
  );
};

export default Sidebar;