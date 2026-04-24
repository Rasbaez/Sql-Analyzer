// 💻 src/components/InvoiceAnalyzer.js
import React from 'react';
import { 
  UploadCloud, Search, Eye, X, Trash2, Box, FileText, ShoppingCart, Activity, 
  Cloud, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Zap, Clock, 
  Ghost, XCircle, Edit3 
} from 'lucide-react';

import { handleCopy } from '../utils/telemetryHelpers';
import { useInvoiceAnalyzer } from '../hooks/useInvoiceAnalyzer'; 
// 🔥 Import corrigido para os nomes que definimos no statusHelpers
import { getGroupStatusInfo, getLogStatusConfig } from '../utils/helpers/statusHelpers'; 

import './componentsCss/TelemetryAnalyzer.css'; 
import videoFundo from './assets/programing-tech.mp4';

// --- SUB-COMPONENTE: BADGE DE STATUS DO GRUPO ---
const GroupStatusBadge = ({ group }) => {
  const config = getGroupStatusInfo(group);
  // Agora o config.type existe porque adicionamos no helper!
  const Icon = config.type === 'ERROR' ? X : (config.type.includes('EDIT') ? Edit3 : (config.type.includes('CANCEL') ? XCircle : CheckCircle));
  
  return (
    <div className={`stat-badge ${config.className}`}>
      <Icon size={12}/> {config.label}
    </div>
  );
};

// --- SUB-COMPONENTE: STATUS DA LINHA (GRID) ---
const LogStatusCell = ({ log }) => {
  const config = getLogStatusConfig(log.status);
  
  if (config.isGhost) {
    return (
      <span className="text-inactive" title={log.status === 'INACTIVE_CANCELLED' ? "Nota cancelada posteriormente" : ""}>
        <Ghost size={14} className="icon-ghost"/> {config.label}
      </span>
    );
  }

  return (
    <div className="status-col">
      <span className={config.color}>{config.icon} {config.label}</span>
      {(log.status.includes('CANCEL') || log.status === 'EDITING') && (
        <span className={`sub-${config.color}`} title={log.cancellationStatus}>
          {log.cancellationStatus?.substring(0, 35)}...
        </span>
      )}
    </div>
  );
};

const InvoiceAnalyzer = () => {
  const {
    logs, meta, loading, isDragging, selectedLog, setSelectedLog,
    filters, setFilters, modalSearchProduct, setModalSearchProduct,
    modalSearchGeneral, setModalSearchGeneral, modalFilterLines, setModalFilterLines,
    expandedCards, toggleCard, openModal, handleDragOver, handleDragLeave,
    handleDrop, handleFileSelect, handleClear, handleApplyFilters, handleKeyDown,
    groupedOrders, highlightData
  } = useInvoiceAnalyzer();

  return (
    <div className="telemetry-container">
      <div className="video-background-container">
        <video autoPlay loop muted playsInline className="video-background-element">
          <source src={videoFundo} type="video/mp4" />
        </video>
      </div>
      
      <header className="telemetry-header">
        <div className="telemetry-title-row">
          <div className="telemetry-title">
            <h2>🧾 Invoice Analyzer (DEBUG)</h2>
            <p>Jornadas completas de Cálculo e Notas Fiscais agrupadas por ciclo.</p>
          </div>
          {logs.length > 0 && (
            <button className="clear-logs-btn" onClick={handleClear}>
              <Trash2 size={18} /> Limpar
            </button>
          )}
        </div>
        
        {logs.length > 0 && (
          <div className="smart-filters-container">
            <div className="filters-row" onKeyDown={handleKeyDown}>
              <div className="filter-group">
                <label><FileText size={14}/> Invoice</label>
                <input list="nf-list" className="filter-input" placeholder="Nº da NF..." value={filters.invoice} onChange={(e) => setFilters({...filters, invoice: e.target.value})} />
                <datalist id="nf-list">{meta.invoices.map(i => <option key={i} value={i} />)}</datalist>
              </div>
              <div className="filter-group">
                <label><ShoppingCart size={14}/> Pedido</label>
                <input list="order-list" className="filter-input" placeholder="ID Pedido..." value={filters.order} onChange={(e) => setFilters({...filters, order: e.target.value})} />
                <datalist id="order-list">{meta.orders.map(o => <option key={o} value={o} />)}</datalist>
              </div>
              <div className="filter-group">
                <label><Box size={14}/> Produto</label>
                <input className="filter-input" placeholder="Cód. Produto..." value={filters.product} onChange={(e) => setFilters({...filters, product: e.target.value})} />
              </div>
              <div className="filter-group">
                <label><Activity size={14}/> Categoria</label>
                <select className="filter-input" value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}>
                  <option value="ALL">Todos</option>
                  <option value="B2B">Somente B2B</option>
                  <option value="Normal">Somente Orgânica</option>
                </select>
              </div>
            </div>
            <div className="search-bar-row">
              <div className="search-input-wrapper" onKeyDown={handleKeyDown}>
                <Search size={18} className="search-icon" />
                <input type="text" placeholder="Busca Universal (ex: Error, BEES, Tabela)..." value={filters.text} onChange={(e) => setFilters({...filters, text: e.target.value})} />
                {filters.text && <X size={18} className="clear-search" onClick={() => setFilters({...filters, text: ''})} />}
              </div>
              <button className="apply-filters-btn" onClick={handleApplyFilters} disabled={loading}><Search size={18} /> Buscar</button>
            </div>
          </div>
        )}
      </header>

      <main className="main-content">
        {loading ? (
           <div className="loading-overlay-massive loading-pad">
             <Cloud size={64} color="#38bdf8" className="spin-icon bounce-anim" />
             <h3 className="loading-title">Agrupando Blocos...</h3>
           </div>
        ) : logs.length === 0 ? (
          <div className={`upload-zone ${isDragging ? 'dragging' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <UploadCloud size={48} color={isDragging ? '#38bdf8' : '#64748b'} />
            <h3>Solte os arquivos de DEBUG aqui</h3>
            <p>Os logs serão agrupados de forma inteligente por Pedido e Invoice.</p>
            <input type="file" multiple accept=".log,.txt" onChange={handleFileSelect} className="file-input-hidden" id="nf-upload" />
            <label htmlFor="nf-upload" className="upload-btn">Selecionar Arquivos</label>
          </div>
        ) : (
          <div className="timeline-panel" style={{ padding: '20px', background: 'transparent' }}>
            {groupedOrders.map(group => {
              const isExpanded = expandedCards[group.id] !== undefined 
                ? expandedCards[group.id] 
                : (filters.text || filters.product || filters.invoice || filters.order);

              return (
                <div key={group.id} className="workflow-card">
                  <div className="workflow-card-header" onClick={() => toggleCard(group.id)}>
                    <div className="workflow-info flex-between-center">
                      <div className="workflow-name flex-align-center">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        <ShoppingCart size={16} className="icon-mr-6"/> Pedido: {group.orderId}
                        <span className="invoice-meta">
                          <span className="icon-mr-4 opacity-50">|</span>
                          <FileText size={13} className="icon-mr-4"/> NF: <strong className="invoice-meta-id">{group.invoiceId}</strong>
                        </span>
                      </div>
                      <div className="workflow-stats flex-align-center">
                        {group.isB2B ? <div className="stat-badge badge-b2b"><Zap size={12}/> B2B</div> : <div className="stat-badge badge-organic"><Cloud size={12}/> Orgânica</div>}
                        <div className="stat-badge"><FileText size={12}/> {group.events.length} Ciclo(s)</div>
                        
                        <GroupStatusBadge group={group} />
                        
                        <div className="stats-timestamp"><Clock size={12}/> {group.timestamp}</div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="telemetry-grid">
                      <div className="grid-header invoice-grid-layout">
                        <div>Horário</div><div>Invoice (NF)</div><div>Pagamento</div><div>Status Log</div><div>Ação</div>
                      </div>
                      {group.events.map(log => (
                        <div key={log.id} className="grid-row invoice-grid-layout">
                          <div className="col-time opacity-50">{log.timestamp.includes(' ') ? log.timestamp.split(' ')[1] : log.timestamp}</div>
                          <div className="col-file">{log.invoiceId}</div>
                          <div className="text-payment">{log.payment.substring(0,30)}</div>
                          
                          <div><LogStatusCell log={log} /></div>
                          
                          <div>
                            <button className="view-details-btn" onClick={() => openModal(log)}>
                              <Eye size={16} /> Ver Bloco
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {groupedOrders.length === 0 && <div className="no-results-warning">Nenhum pedido encontrado.</div>}
          </div>
        )}
      </main>

      {/* 💻 MODAL INSPECTOR */}
      {selectedLog && (
        <div className="ide-modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="ide-modal-window modal-window-wide" onClick={e => e.stopPropagation()}>
            <div className="ide-window-header">
              <div className="ide-window-controls">
                <span className="dot close" onClick={() => setSelectedLog(null)}></span>
                <span className="dot minimize"></span>
                <span className="dot maximize"></span>
              </div>
              <div className="ide-window-title">Jornada da Invoice: {selectedLog.invoiceId}</div>
              <button className="close-btn-clean" onClick={() => setSelectedLog(null)}><X size={20}/></button>
            </div>
            
            <div className="ide-window-body">
              {selectedLog.isEdit && (
                <div className="alert-box edit-box">
                    <Edit3 size={32} className="flex-shrink-0"/>
                    <div>
                      <h3 className="alert-title edit">📝 Edição de Nota Fiscal Detectada</h3>
                      <p className="alert-desc edit">Status: <strong>{selectedLog.cancellationStatus}</strong></p>
                    </div>
                </div>
              )}

              {selectedLog.isCancelled && !selectedLog.isEdit && (
                <div className="alert-box cancel-box">
                    <XCircle size={32} className="flex-shrink-0"/>
                    <div>
                      <h3 className="alert-title cancel">⚠️ Cancelamento Detectado</h3>
                      <p className="alert-desc cancel">Status Servidor: <strong>{selectedLog.cancellationStatus || 'Cancelamento Solicitado'}</strong></p>
                    </div>
                </div>
              )}

              <div className="ide-context-panel">
                <div className="ide-tag"><FileText size={12} /> {selectedLog.fileName}</div>
                <div className="ide-tag"><ShoppingCart size={12} /> Order: {selectedLog.orderId}</div>
                {selectedLog.isB2B ? <div className="ide-tag badge-b2b"><Zap size={12} /> B2B</div> : <div className="ide-tag badge-organic"><Cloud size={12} /> Nota Orgânica</div>}
                {selectedLog.status === 'CONTINGENCY' && <div className="ide-tag badge-contingency"><AlertTriangle size={12} /> Contingência Offline</div>}
                {selectedLog.status.includes('INACTIVE') && <div className="ide-tag badge-inactive"><Ghost size={12} /> Inativa/Substituída</div>}
              </div>

              <div className="ide-payload-panel">
                <div className="modal-search-bar">
                  <div className="search-input-wrapper modal-search-input">
                    <Box size={16} className="search-icon" />
                    <input type="text" placeholder="Buscar Produto..." value={modalSearchProduct} onChange={(e) => setModalSearchProduct(e.target.value)} />
                  </div>
                  <div className="search-input-wrapper modal-search-input">
                    <Search size={16} className="search-icon" />
                    <input type="text" placeholder="Busca geral interna..." value={modalSearchGeneral} onChange={(e) => setModalSearchGeneral(e.target.value)} />
                  </div>
                  <label className="modal-checkbox-label">
                    <input type="checkbox" checked={modalFilterLines} onChange={(e) => setModalFilterLines(e.target.checked)}/> 
                    Ocultar linhas sem o termo
                  </label>
                </div>
                
                <div className="ide-payload-header" style={{ borderTop: 'none' }}>
                  <div className="ide-tabs"><button className="ide-tab-btn active">texto_bruto_nfe.log</button></div>
                  <button className="ide-copy-btn" onClick={() => handleCopy(selectedLog.rawDetails)}>
                    <FileText size={12} /> Copiar Bloco
                  </button>
                </div>
                
                <div className="code-view-container">
                  {!modalFilterLines && highlightData.terms.length > 0 && highlightData.matches.length > 0 && (
                    <div className="minimap-container">
                      {highlightData.matches.map((lineIndex, i) => (
                        <div 
                          key={i} 
                          className="minimap-marker" 
                          style={{ top: `${(lineIndex / highlightData.totalLines) * 100}%` }} 
                          onClick={() => document.getElementById(`match-line-${lineIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                        />
                      ))}
                    </div>
                  )}

                  <div className="code-content">
                    <pre className="sql-code-block code-pre-clean" dangerouslySetInnerHTML={{ __html: highlightData.html }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceAnalyzer;