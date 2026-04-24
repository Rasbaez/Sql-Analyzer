// 💻 src/components/MongoInvoiceAnalyzer.js
import React, { useState } from 'react';
import { 
  Database, Search, FileJson, AlertCircle, CheckCircle, X, 
  ServerCrash, AlertTriangle, ChevronRight, Clock, Hash, 
  DollarSign, Copy, Square, RefreshCw 
} from 'lucide-react';

import MongoConnectionModal from './MongoConnectionModal';
import { useMongoInvoice } from '../hooks/useMongoInvoice';
import './componentsCss/MongoInvoiceAnalyzer.css';

const MongoInvoiceAnalyzer = () => {
  const TARGET_COLLECTION = 'InvoiceSapExport';

  // Configuração do Banco
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [mongoConfig, setMongoConfig] = useState(() => ({
    server: localStorage.getItem('mongo_server') || '',
    database: localStorage.getItem('mongo_db') || 'MDB_PEPSICO_BR',
    user: localStorage.getItem('mongo_user') || '',
    password: localStorage.getItem('mongo_pass') || ''
  }));

  // Estados dos Inputs
  const [inputs, setInputs] = useState({ invoices: '', series: '', branches: '' });
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // 🔥 Chamada do nosso Hook Customizado
  const { loading, results, missingInvoices, handleSearch, handleStop } = useMongoInvoice(mongoConfig, TARGET_COLLECTION);

  // Formatação de Data amigável
  const formatarData = (dataStr) => {
    if (!dataStr) return '---';
    const dataObj = new Date(dataStr);
    return isNaN(dataObj) ? dataStr : dataObj.toLocaleString('pt-BR');
  };

  return (
    <div className="telemetry-container">
      <header className="telemetry-header">
        <div className="telemetry-title-row">
          <div className="flex-align-center" style={{ gap: '15px' }}>
            <h2>🧾 Validador MongoDB</h2>
            <div className="mongo-context-badge">
              <Database size={14} /> MDB_PEPSICO_BR <ChevronRight size={14} opacity={0.5} /> 📂 {TARGET_COLLECTION}
            </div>
          </div>

          <button 
            className="apply-filters-btn" 
            onClick={() => setIsModalOpen(true)}
            style={{ background: mongoConfig.server ? '#059669' : '#eab308' }}
          >
            <Database size={18} /> {mongoConfig.server ? 'Conectado' : 'Conectar Banco'}
          </button>
        </div>

        <div className="filters-row mongo-grid-inputs">
          <div className="filter-group">
            <label className="mongo-input-label"><FileJson size={14}/> cIDInvoice</label>
            <textarea 
              className="filter-input" 
              value={inputs.invoices} 
              onChange={(e) => setInputs({...inputs, invoices: e.target.value})} 
              rows={3} 
              placeholder="Ex: 8780, 8779..." 
            />
          </div>

          <div className="filter-group">
            <label className="mongo-input-label"><FileJson size={14}/> cSerie</label>
            <textarea 
              className="filter-input" 
              value={inputs.series} 
              onChange={(e) => setInputs({...inputs, series: e.target.value})} 
              rows={3} 
              placeholder="Ex: 82..." 
            />
          </div>

          <div className="filter-group">
            <label className="mongo-input-label"><FileJson size={14}/> cIDBranchInvoice</label>
            <textarea 
              className="filter-input" 
              value={inputs.branches} 
              onChange={(e) => setInputs({...inputs, branches: e.target.value})} 
              rows={3} 
              placeholder="Ex: 7832..." 
            />
          </div>
        </div>

        <div className="mongo-action-row">
           {loading ? (
             <button className="apply-filters-btn stop-btn" onClick={handleStop}>
                <Square size={18} fill="currentColor" /> Parar Consulta
             </button>
           ) : (
             <button className="apply-filters-btn" onClick={() => handleSearch(inputs)}>
                <Search size={18} /> Consultar e Validar
             </button>
           )}
        </div>
      </header>

      <main className="main-content" style={{ padding: '20px' }}>
        
        {loading && (
          <div className="loading-state-overlay">
            <RefreshCw size={40} className="animate-spin text-primary" />
            <p>Consultando e validando notas no MongoDB...</p>
          </div>
        )}

        {missingInvoices.length > 0 && !loading && (
          <div className="alert-box cancel-box">
            <AlertTriangle size={24} className="text-warning" />
            <div>
              <h3 className="alert-title text-warning">Notas não encontradas</h3>
              <p className="alert-desc text-warning">{missingInvoices.join(', ')}</p>
            </div>
          </div>
        )}

        {results.map(nf => {
          const isAtiva = nf.parsedJson?.NFE_STS !== 'AS';
          return (
            <div key={nf.cMessageUniqueID} className="mongo-invoice-card">
              <div className="mongo-card-header">
                <div className="mongo-header-id">
                  <strong>NF: {nf.cIDInvoice}</strong>
                  <span className="mongo-divider">|</span>
                  <span>CDV: {nf.cIDBranchInvoice}</span>
                  <span className={`mongo-status-badge ${isAtiva ? 'mongo-status-active' : 'mongo-status-inactive'}`}>
                    {isAtiva ? 'Nota Ativa' : 'Nota Inativa'}
                  </span>
                </div>
                <button className="view-details-btn" onClick={() => setSelectedInvoice(nf)}>
                  <FileJson size={16} /> Ver JSON
                </button>
              </div>
              
              <div className="mongo-card-body">
                <div className="mongo-info-block">
                  <span className="mongo-info-label"><DollarSign size={13}/> Valor Total</span>
                  <span className="mongo-val-text">{nf.formattedValue || 'R$ 0,00'}</span>
                </div>
                <div className="mongo-info-block">
                  <span className="mongo-info-label"><Clock size={13}/> TimeStamp</span>
                  <span className="mongo-date-text">{formatarData(nf.exportDate || nf.mc1LastUpdate)}</span>
                </div>
                <div className="mongo-info-block">
                  <span className="mongo-info-label"><Hash size={13}/> MUID</span>
                  <div className="mongo-muid-container">
                    <span className="mongo-muid-text">{nf.cMessageUniqueID}</span>
                    <button className="mongo-copy-btn" onClick={() => navigator.clipboard.writeText(nf.cMessageUniqueID)}>
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className={`mongo-card-footer ${nf.alerts?.length > 0 ? 'mongo-footer-error' : 'mongo-footer-success'}`}>
                 {nf.alerts?.length > 0 ? (
                   nf.alerts.map((al, i) => <div key={i} className="flex-align-center text-error"><AlertCircle size={14} /> {al.msg}</div>)
                 ) : (
                   <div className="text-success flex-align-center"><CheckCircle size={14} /> Integração Perfeita</div>
                 )}
              </div>
            </div>
          );
        })}
      </main>

      <MongoConnectionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={setMongoConfig} 
      />

      {selectedInvoice && (
        <div className="ide-modal-overlay" onClick={() => setSelectedInvoice(null)}>
           <div className="ide-modal-window modal-window-wide" onClick={e => e.stopPropagation()}>
              <div className="ide-window-header">
                 <span>JSON da NF: {selectedInvoice.cIDInvoice}</span>
                 <X onClick={() => setSelectedInvoice(null)} style={{ cursor: 'pointer' }} />
              </div>
              <div className="ide-window-body">
                 <pre className="sql-code-block">{JSON.stringify(selectedInvoice.parsedJson, null, 2)}</pre>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MongoInvoiceAnalyzer;