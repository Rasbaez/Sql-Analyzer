// 🎨 src/components/RouteAnalyzer.js - Dashboard War Room (Clean Code Edition 🚀)
import React, { useState } from 'react';
import './componentsCss/RouteAnalyzer.css'; 

import { ShieldAlert, Cpu, Database, X, Search, XCircle, FileJson } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// HOOKS E COMPONENTES FILHOS
import { useRouteData } from '../hooks/useRouteData'; 
import RouteKpis from './RouteKpis'; 
import RouteContextCards from './RouteContextCards'; 
import RouteTables from './RouteTable';
import ConnectionModal from './ConnectionModal'; 
import MongoInvoiceCard from './shared/MongoInvoiceCard'; 
import MongoEodCard from './shared/MongoEodCard'; 
import { useApp } from '../context/AppContext';
import videoFundo from './assets/background-tech.mp4';

const RouteAnalyzer = () => {
  const { connection } = useApp();
  
  const { 
    rota, setRota, loading, routeData, historico, handleBuscarRota, handleCancelRoute, errorMessage, t,
    isConnectionModalOpen, setIsConnectionModalOpen,
    selectedMuidData, setSelectedMuidData,
    isMuidLoading, handleSaveConnection, handleVerMuid,
    selectedEodData, setSelectedEodData, 
    isEodLoading, handleVerEod
  } = useRouteData();



  // 🔥 NOVOS ESTADOS PARA O MODAL DO JSON (MAC OS)
  const [selectedJsonData, setSelectedJsonData] = useState(null);
  const [jsonSearchTerm, setJsonSearchTerm] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleBuscarRota();
  };

  const getOverlayClass = () => {
    if (errorMessage) return 'overlay-alerta'; 
    if (!routeData) return 'overlay-padrao';
    const status = routeData.statusInicioDia;
    if (status === 'FINALIZADO') return 'overlay-finalizado';
    if (status === 'INICIADO' || status === 'INÍCIO EM AND.') return 'overlay-iniciado';
    if (status === 'NÃO INICIADO' || status === 'SEM ROTA HOJE') return 'overlay-alerta';
    return 'overlay-padrao';
  };

  // Função para evitar quebra ao clicar em "Copiar TXT" no card de EOD
  const handleCopySingleTxt = (eod) => {
    const { GPID, trip, liq, ordersQty, totalOfItems } = eod.extracted || {};
    const isoTime = eod.mc1LastUpdate ? new Date(eod.mc1LastUpdate).toISOString() : 'N/A';
    const text = `Danfinhas: ${ordersQty || 0} Items(un): ${totalOfItems || 0}\nTourID: ${trip || '-'} Liquidate: ${liq || eod.cIDLiquidate}\nTimeStamp: ${isoTime} -- User: ${GPID || ''}\nMUID: ${eod.cMessageUniqueID}\n`;
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(()=>{});
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 15 } } };





  return (
    <div className="route-analyzer-container">
      
      <div className="video-background-container">
        <video autoPlay loop muted playsInline className="video-background-element">
          <source src={videoFundo} type="video/mp4" />
        </video>
      </div>

      <div className={`status-overlay ${getOverlayClass()}`} />

      <div style={{ position: 'relative', zIndex: 2 }}>
        
        {/* HEADER E BARRA DE BUSCA */}
        <header className="dashboard-header">
          <div className="header-title-wrapper">
            <h2>📊 {t('route_analyzer_title')}</h2>
            <div className="header-credits-wrapper">
               <p className="dashboard-subtitle">{t('route_analyzer_subtitle')}</p>
               <span className="dev-signature-header">By Roberto Baez 🚀</span>
            </div>
          </div>
          
          <div className="header-right-wrapper"> 
            <div className="search-bar-panel">
              <button onClick={() => setIsConnectionModalOpen(true)} className="db-config-btn-style">
                <Database size={14} />
                {connection.database ? connection.database : t('route_configure_connection')}
              </button>

              <input 
                type="text" 
                placeholder={t('route_placeholder')} 
                value={rota} 
                list="historico-rotas" 
                autoComplete="off" 
                onChange={(e) => setRota(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown} 
                onClick={() => setRota('')}
                onFocus={() => setRota('')}
              />
              <datalist id="historico-rotas">
                {historico?.map((r, index) => <option key={index} value={r} />)}
              </datalist>
              
              <button onClick={handleBuscarRota} disabled={loading} className={loading ? 'loading-btn' : ''}>
                {loading ? t('route_processing') : t('route_analyze_button')}
              </button>
              {loading && (
                <button onClick={handleCancelRoute} className="btn-cancel-route" title="Cancelar consulta (timeout em 30s)">
                  🛑 Cancelar
                </button>
              )}
            </div>
          </div>
        </header>

        {/* LOADING */}
        {loading && (
          <motion.div className="tech-loading-overlay" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="radar-spinner"><Cpu size={32} color="#38bdf8" className="radar-core-icon" /></div>
            <div className="loading-text-container">
              <span className="loading-glitch">ESTABELECENDO CONEXÃO SEGURA...</span>
              <span className="loading-sub">Acessando base corporativa e extraindo telemetria da rota</span>
            </div>
          </motion.div>
        )}

        {/* ERROS */}
        {errorMessage && !loading && (
          <motion.div className="alert-box error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <ShieldAlert size={64} color="#ef4444" style={{ marginBottom: '15px' }} />
            <h3>Atenção</h3>
            <p>{errorMessage}</p>
          </motion.div>
        )}

        {/* O DASHBOARD RENDERIZADO */}
        {!loading && !errorMessage && routeData && (
          <motion.div className="bi-dashboard-layout" initial="hidden" animate="visible" variants={containerVariants}>
            
            <RouteKpis 
              routeData={routeData} 
              itemVariants={itemVariants} 
              onVerEod={handleVerEod}           
              isEodLoading={isEodLoading}       
            />
            <RouteContextCards routeData={routeData} itemVariants={itemVariants} />
            <RouteTables 
              routeData={routeData} 
              isPVV={routeData?.xRouteType === 'B07'} 
              itemVariants={itemVariants} 
              onVerMuid={handleVerMuid}
              isMuidLoading={isMuidLoading}
            />

            <motion.footer className="dashboard-footer" variants={itemVariants}>
              <div className="footer-line"></div>
              <p>Sistema de Diagnóstico WTM v2.0</p>
              <p className="dev-signature-footer">Desenvolvido por <strong>Roberto Baez 🚀</strong></p>
            </motion.footer>

          </motion.div>
        )}

        {/* MODAIS */}
        <AnimatePresence>
          {/* MODAL MUID (NOTA FISCAL) */}
          {selectedMuidData && (
            <motion.div className="ide-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedMuidData(null)}>
              <motion.div className="ide-modal-window" style={{ maxWidth: '850px', border: '1px solid #10b981', zIndex: 9999 }} onClick={e => e.stopPropagation()} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}>
                <div className="ide-window-header">
                  <div className="flex-align-center" style={{gap: '10px'}}><Database size={18} color="#10b981" /><span>Detalhes Técnicos da Nota (MongoDB)</span></div>
                  <X size={20} onClick={() => setSelectedMuidData(null)} style={{ cursor: 'pointer' }} />
                </div>
                <div className="ide-window-body" style={{ padding: '20px', background: '#0f172a' }}>
                  {/* 🔥 AGORA ELE ABRE O MODAL AO INVÉS DO CONSOLE.LOG */}
                  <MongoInvoiceCard nf={selectedMuidData} onOpenJson={(nf) => setSelectedJsonData(nf)} />
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* MODAL DE EXIBIÇÃO DO EOD */}
          {selectedEodData && selectedEodData.length > 0 && (
            <motion.div className="ide-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedEodData(null)}>
              <motion.div className="ide-modal-window" style={{ maxWidth: '850px', border: '1px solid #38bdf8', zIndex: 9999 }} onClick={e => e.stopPropagation()} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}>
                
                <div className="ide-window-header" style={{ borderBottom: '1px solid #38bdf8' }}>
                  <div className="flex-align-center" style={{gap: '10px'}}>
                    <Database size={18} color="#38bdf8" />
                    <span>Análise de Fim de Dia (MongoDB)</span>
                  </div>
                  <X size={20} onClick={() => setSelectedEodData(null)} style={{ cursor: 'pointer' }} />
                </div>
                
                <div className="ide-window-body" style={{ padding: '20px', background: '#0f172a', maxHeight: '70vh', overflowY: 'auto' }}>
                  {selectedEodData.map((eodItem, index) => (
                    <div key={index} style={{ marginBottom: index !== selectedEodData.length - 1 ? '20px' : '0' }}>
                      {/* 🔥 AGORA ELE ABRE O MODAL AO INVÉS DO CONSOLE.LOG */}
                      <MongoEodCard 
                        eod={eodItem} 
                        onOpenJson={(eodObj) => setSelectedJsonData(eodObj)} 
                        onCopyEod={handleCopySingleTxt}
                      />
                    </div>
                  ))}
                </div>

              </motion.div>
            </motion.div>
          )}

          {/* 🔥 NOVO: MODAL MAC OS COM BARRA DE BUSCA JSON (Para Notas e EODs) */}
          {selectedJsonData && (
            <motion.div 
              className="ide-modal-overlay" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => { setSelectedJsonData(null); setJsonSearchTerm(''); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }} // 🔥 Z-INDEX GIGANTE PRA FICAR POR CIMA!
            >
              <motion.div 
                className="ide-modal-window" 
                style={{ maxWidth: '950px', width: '90%', border: '1px solid #334155', borderRadius: '10px', overflow: 'hidden', background: '#0d1117', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }} 
                onClick={e => e.stopPropagation()} 
                initial={{ scale: 0.95, y: 20 }} 
                animate={{ scale: 1, y: 0 }}
              >
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#1e293b', borderBottom: '1px solid #334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div onClick={() => { setSelectedJsonData(null); setJsonSearchTerm(''); }} style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#ff5f56', cursor: 'pointer', boxShadow: 'inset 0 0 4px rgba(0,0,0,0.2)' }} title="Fechar" />
                      <div style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#ffbd2e', boxShadow: 'inset 0 0 4px rgba(0,0,0,0.2)' }} />
                      <div style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#27c93f', boxShadow: 'inset 0 0 4px rgba(0,0,0,0.2)' }} />
                    </div>
                    <span style={{ color: '#e2e8f0', fontSize: '13px', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileJson size={15} color="#38bdf8" />
                      MUID: {selectedJsonData.cMessageUniqueID}
                    </span>
                  </div>

                  <div style={{ position: 'relative', width: '250px' }}>
                    <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder="Buscar no JSON..."
                      value={jsonSearchTerm}
                      onChange={(e) => setJsonSearchTerm(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px 6px 32px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '12px', outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' }}
                    />
                    {jsonSearchTerm && (
                      <XCircle size={14} color="#94a3b8" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} onClick={() => setJsonSearchTerm('')} />
                    )}
                  </div>
                </div>
                
                <div style={{ padding: '20px', maxHeight: '75vh', overflowY: 'auto', background: '#0d1117' }}>
                  <pre style={{ color: '#a5b4fc', fontSize: '13.5px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, fontFamily: "'Consolas', 'Courier New', monospace", lineHeight: '1.5' }}>
                    {(() => {
                      // 🔥 Aceita parsedJson (EOD) ou cJson convertido (Invoice)
                      const jsonToRender = selectedJsonData.parsedJson || (typeof selectedJsonData.cJson === 'string' ? JSON.parse(selectedJsonData.cJson) : selectedJsonData.cJson);
                      const jsonString = JSON.stringify(jsonToRender, null, 2);
                      
                      if (!jsonSearchTerm) return jsonString;
                      
                      const parts = jsonString.split(new RegExp(`(${jsonSearchTerm})`, 'gi'));
                      return parts.map((part, index) => 
                        part.toLowerCase() === jsonSearchTerm.toLowerCase() ? (
                          <mark key={index} style={{ backgroundColor: '#facc15', color: '#0f172a', borderRadius: '2px', padding: '0 2px', fontWeight: 'bold' }}>{part}</mark>
                        ) : part
                      );
                    })()}
                  </pre>
                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <ConnectionModal 
          isOpen={isConnectionModalOpen} 
          onClose={() => setIsConnectionModalOpen(false)} 
          onSave={handleSaveConnection}
        />

      </div>
    </div>
  );
};

export default RouteAnalyzer;