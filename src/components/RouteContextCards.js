// 🗂️ src/components/RouteContextCards.js
import React from 'react';
import { DatabaseBackup, UserCog, MapPin, History, Truck, PackageSearch, LocateFixed } from 'lucide-react';
import { motion } from 'framer-motion';
import { getManifestStatus, formatDate } from '../utils/data';

const RouteContextCards = ({ routeData, itemVariants }) => {
  return (
    <div className="bi-context-grid">
      
      {/* 1. DADOS CADASTRAIS */}
      <motion.div className="bi-info-card card-white" variants={itemVariants}>
        <h3><DatabaseBackup size={18} color="#0284c7" /> Dados Cadastrais</h3>
        <div className="info-list">
          <div className="info-item"><span>Rota:</span> <strong>{routeData.cIDTerritory || '-'}</strong></div>
          <div className="info-item"><span>Filial:</span> <strong>{routeData.cidbranchinvoice || 'N/A'}</strong></div>
          <div className="info-item"><span>Hierarquia:</span> <strong>{routeData.cIDCommercialHierarchyParent || 'N/A'}</strong></div>
        </div>
      </motion.div>

      {/* 2. USUÁRIO */}
      <motion.div className="bi-info-card card-white" variants={itemVariants}>
        <h3><UserCog size={18} color="#0284c7" /> Usuário Operacional</h3>
        <div className="info-list">
          <div className="info-item"><span>Nome:</span> <strong>{routeData.cUserName || 'N/A'}</strong></div>
          <div className="info-item"><span>GPID:</span> <strong>{routeData.cIDUser || 'N/A'}</strong></div>
          <div className="info-item"><span>YG05:</span> <strong>{routeData.YG05 || 'N/A'}</strong></div>
        </div>
      </motion.div>

      {/* 3. BASE OPERACIONAL */}
      <motion.div className="bi-info-card card-white" variants={itemVariants}>
        <h3><MapPin size={18} color="#0284c7" /> Base Operacional</h3>
        <div className="info-list">
          <div className="info-item"><span>Cidade:</span> <strong>{routeData.cCityName || 'N/A'}</strong></div>
          <div className="info-item"><span>Bairro:</span> <strong>{routeData.cNeighborhood || 'N/A'}</strong></div>
          <div className="info-item"><span>Estado:</span> <strong>{routeData.cStateName || 'N/A'}</strong></div>
        </div>
      </motion.div>

      {/* 4. FECHAMENTOS */}
      <motion.div className="bi-info-card card-white" variants={itemVariants}>
        <h3><History size={18} color="#0284c7" /> Fechamentos</h3>
        <div className="info-list">
          <div className="info-item"><span>Veículo:</span> <strong>{formatDate(routeData?.dLastInventory)}</strong></div>
          <div className="info-item"><span>Financeiro:</span> <strong>{formatDate(routeData?.dLastFinancial)}</strong></div>
          <div className="info-item"><span>Fiscal:</span> <strong>{formatDate(routeData?.dLastClosure)}</strong></div>
        </div>
      </motion.div>

      {/* 5. MANIFESTO */}
      <motion.div className={`bi-info-card card-white ${routeData.manifesto && getManifestStatus(routeData.manifesto).alert ? 'border-top-warning' : 'border-top-default'}`} variants={itemVariants}>
        <h3><Truck size={18} color="#64748b" /> Status do Manifesto</h3>
        <div className="info-list">
          {routeData.manifesto ? (
            <>
              <div className="info-item"><span>Manifesto:</span> <strong>{routeData.manifesto.nManifest}</strong></div>
              <div className="info-item"><span>Criado em:</span> <strong>{formatDate(routeData.manifesto?.dLotCreated)}</strong></div>
              <div className="manifest-alert-box">
                <strong className={getManifestStatus(routeData.manifesto).alert ? 'text-warning font-14' : 'text-success font-14'}>
                  {!getManifestStatus(routeData.manifesto).alert && <span className="live-dot"></span>}
                  {getManifestStatus(routeData.manifesto).text}
                </strong>
              </div>
            </>
          ) : (<div className="empty-state-text">Nenhum manifesto localizado.</div>)}
        </div>
      </motion.div>

      {/* 6. INVENTÁRIO (O QUE CORTOU) */}
      <motion.div className={`bi-info-card card-white ${routeData.inventario ? 'border-top-info' : 'border-top-default'}`} variants={itemVariants}>
        <h3><PackageSearch size={18} color="#0284c7" /> Status do Inventário</h3>
        <div className="info-list">
          {routeData.inventario ? (
            <>
              <div className="info-item">
                <span>Status:</span> 
                <strong className="text-success">
                  <span className="live-dot"></span> Ativo na Rota
                </strong>
              </div>
              <div className="info-item"><span>SKUs:</span> <strong className="text-info">{routeData.inventario.QtdSKUs || 0} itens</strong></div>
              <div className="info-item"><span>Vol. Físico:</span> <strong>{Math.round(routeData.inventario.QtdTotalFisica || 0)} un</strong></div>
              <p className="inventory-tip">Mais detalhes no menu <strong>Inventário</strong></p>
            </>
          ) : (
            <div className="empty-state-text">Nenhum inventário ativo localizado.</div>
          )}
        </div>
      </motion.div>

      {/* 7. VISITA ATUAL (FULL WIDTH) */}
      <motion.div className="bi-info-card card-white border-top-info card-full-width" variants={itemVariants}>
        <h3><LocateFixed size={18} color="#0284c7" /> Visita Atual (Hoje)</h3>
        <div className="info-list">
          {routeData.ultimaVisita ? (
            <div className="visita-grid">
              <div className="visita-item bordered"><span className="visita-label">Tipo de Parada</span><strong className="visita-val-info">{routeData.ultimaVisita.TipoCheckIn || '-'}</strong></div>
              <div className="visita-item bordered"><span className="visita-label">Cliente Atual</span><strong className="visita-val-default">{routeData.ultimaVisita.cCustomerShortName || routeData.ultimaVisita.cIDCustomer || '-'}</strong></div>
              <div className="visita-item bordered"><span className="visita-label">Check-in</span><strong className="visita-val-large">{formatDate(routeData.ultimaVisita?.dCheckin)}</strong></div>
              <div className="visita-item"><span className="visita-label">Status da Tarefa</span><span className={`status-badge large ${routeData.ultimaVisita.StatusTarefa === 'Concluída' ? 'badge-success' : 'badge-warning'}`}>{routeData.ultimaVisita.StatusTarefa || '-'}</span></div>
            </div>
          ) : (<div className="empty-state-text" style={{marginTop: '0'}}>Nenhum check-in registrado hoje.</div>)}
        </div>
      </motion.div>

    </div>
  );
};

export default RouteContextCards;