// 📊 src/components/RouteKpis.js
import React from 'react';
import { Route, Target, CloudDownload, DatabaseZap, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { renderTaskStatus } from '../utils/data';

// 🔥 AQUI: Adicionei as props onVerEod e isEodLoading que estavam faltando!
const RouteKpis = ({ routeData, itemVariants, onVerEod, isEodLoading }) => {
  const isPVV = routeData?.xRouteType === 'B07';
  
  // Cálculos de Sincronização
  const notasEmitidas = routeData?.listaNotas?.length || 0;
  const notasExportadas = routeData?.listaNotas?.filter(n => n.dQueue != null && n.dExport != null).length || 0;
  const pedidosEmitidos = routeData?.listaPedidos?.length || 0;
  const pedidosExportados = routeData?.listaPedidos?.filter(p => p.dExport != null).length || 0;

  const getSyncColorClass = () => {
    const pendentes = isPVV ? (pedidosEmitidos - pedidosExportados) : (notasEmitidas - notasExportadas);
    if (pendentes > 0) return 'text-danger';
    if ((isPVV ? pedidosEmitidos : notasEmitidas) > 0 && pendentes === 0) return 'text-success';
    return 'text-white';
  };

  // Função auxiliar para deixar o nome da rota bonitão
  const getRouteTypeName = () => {
    if (isPVV) return 'Rota PVV (Pré-Venda)';
    if (routeData?.xRouteType === 'B05') return 'Rota DTS (Pronta Entrega)';
    if (routeData?.xRouteType === 'B04') return 'Rota OT';
    return 'Rota Padrão';
  };

  return (
    <div className="bi-kpi-row">
      
      {/* 1. STATUS DA ROTA */}
      <motion.div className={`bi-kpi-card ${renderTaskStatus(routeData.statusInicioDia).classe}`} variants={itemVariants}>
        <div className="kpi-icon"><Route size={32} strokeWidth={1.5} color="#ffffff" /></div>
        <div className="kpi-content">
          <span className="kpi-title">Status da Rota</span>
          <span className="kpi-value">{renderTaskStatus(routeData.statusInicioDia).texto}</span>
          <span className="kpi-sub">{getRouteTypeName()}</span>
          
          {/* EOD só aparece se NÃO for PVV (!isPVV) */}
          {routeData.statusInicioDia === 'FINALIZADO' && !isPVV && (
            <div style={{ marginTop: '10px', padding: '6px 10px', background: 'rgba(0,0,0,0.06)', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(0,0,0,0.05)', width: 'fit-content' }}>
              <strong style={{ color: '#475569' }}>EOD:</strong>
              {routeData.liquidate ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  
                  {/* 🔥 O BOTÃO VER NO MONGO VOLTOU AQUI! */}
                  <button 
                    onClick={() => onVerEod(routeData.liquidate, '0546')}
                    disabled={isEodLoading}
                    style={{ 
                      background: 'transparent', 
                      border: '1px solid #10b981', 
                      color: '#10b981', 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      fontSize: '11px', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {isEodLoading ? <Cpu size={12} className="spin-animation"/> : <DatabaseZap size={12} />}
                    {isEodLoading ? 'Buscando...' : 'Ver no Mongo'}
                  </button>
                </div>
              ) : (
                <span className="text-danger font-bold" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="live-dot danger" style={{ width: '8px', height: '8px', marginRight: '5px' }}></span> Pendente
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* 2. PLANEJAMENTO DIÁRIO */}
      <motion.div className={`bi-kpi-card ${routeData.visitasFinalizadas ? 'kpi-success' : (routeData.temVisitaProgramada ? 'kpi-primary' : 'kpi-danger')}`} variants={itemVariants}>
        <div className="kpi-icon"><Target size={32} strokeWidth={1.5} color="#ffffff" /></div>
        <div className="kpi-content">
          <span className="kpi-title">Planejamento Diário</span>
          <span className="kpi-value">{!routeData.temVisitaProgramada ? 'SEM VISITAS' : (routeData.visitasFinalizadas ? 'VISITAS FINALIZADAS' : 'COM VISITAS')}</span>
          <span className="kpi-sub">{!routeData.temVisitaProgramada ? 'Nenhuma programação hoje' : 'Rota com clientes programados'}</span>
        </div>
      </motion.div>

      {/* 3. SINCRONIZAÇÃO */}
      <motion.div className="bi-kpi-card kpi-dark" variants={itemVariants}>
        <div className="kpi-icon"><CloudDownload size={32} strokeWidth={1.5} color="#94a3b8" /></div>
        <div className="kpi-content">
          <span className="kpi-title">{isPVV ? 'Sincronização (Pedidos)' : 'Sincronização (NFs)'}</span>
          <span className="kpi-value">
            <span className={getSyncColorClass()}>{isPVV ? pedidosExportados : notasExportadas}</span> 
            <span className="sync-total"> / {isPVV ? pedidosEmitidos : notasEmitidas}</span>
          </span>
          <span className="kpi-sub">Exportadas/Total</span>
        </div>
      </motion.div>
      
    </div>
  );
};

export default RouteKpis;