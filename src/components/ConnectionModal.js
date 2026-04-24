import React from 'react';
import { Database, Server, Zap, X, Activity, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { useConnectionModal } from '../hooks/useConnectionModal'; 
import { useApp } from '../context/AppContext'; 
import './componentsCss/ConnectionModal.css';

const ConnectionModal = ({ isOpen, onClose, onSave }) => {
  const { state, refs, actions } = useConnectionModal(isOpen, onClose, onSave);
  const { connection } = useApp(); 

  if (!isOpen) return null;

  const cleanDisplay = (val) => (val === '[object Object]' ? '' : val);

 
  const modalTitle = connection.isConnected 
    ? `Conectado: ${connection.database}` 
    : 'Conectar ao Ambiente';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}><X size={22} /></button>
        
        <div className="modal-header">
          <div className="modal-icon-wrapper">
            {/* Muda a cor do ícone se estiver conectado ou não */}
            <Database size={32} color={connection.isConnected ? "#10b981" : "#38bdf8"} />
          </div>
          <div>
            <h2 className="modal-title">{modalTitle}</h2>
            <p className="modal-status-badge">
              {connection.isConnected ? (
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                  <CheckCircle2 size={12} /> Link Ativo
                </span>
              ) : (
                <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                  <AlertCircle size={12} /> Aguardando Conexão
                </span>
              )}
            </p>
          </div>
        </div>

        <form>
          {/* CAMPO SERVIDOR */}
          <div className="input-group" ref={refs.serverRef}>
            <label className="input-label"><Server size={14} color="#38bdf8" /> Servidor</label>
            <div className="custom-select-wrapper">
              <input 
                type="text" 
                className="input-field"
                value={cleanDisplay(state.server)} 
                onChange={(e) => { actions.setServer(e.target.value); actions.setShowServerList(true); }}
                onFocus={() => actions.setShowServerList(true)}
                placeholder="Ex: ag_pps_br_list.aws.mc1.br"
              />
              <button 
                type="button" 
                className="dropdown-arrow" 
                onClick={() => actions.setShowServerList(!state.showServerList)}
              >
                <ChevronDown size={16} />
              </button>
              
              {state.showServerList && state.serverHistory.length > 0 && (
                <ul className="history-dropdown">
                  {state.serverHistory.map((s, i) => {
                    const serverName = typeof s === 'string' ? s : (s?.server || '');
                    if (!serverName || serverName === '[object Object]') return null; 
                    return (
                      <li key={i} onClick={() => { actions.setServer(serverName); actions.setShowServerList(false); }}>
                        {serverName}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* CAMPO BANCO DE DADOS */}
          <div className="input-group" ref={refs.dbRef}>
            <label className="input-label"><Database size={14} color="#38bdf8" /> Banco de Dados</label>
            <div className="custom-select-wrapper">
              <input 
                type="text" 
                className="input-field"
                value={cleanDisplay(state.database)} 
                onChange={(e) => { actions.setDatabase(e.target.value); actions.setShowDbList(true); }}
                onFocus={() => actions.setShowDbList(true)}
                placeholder="Ex: BO_WTM_PEPSICO_BR"
              />
              <button 
                type="button" 
                className="dropdown-arrow" 
                onClick={() => actions.setShowDbList(!state.showDbList)}
              >
                <ChevronDown size={16} />
              </button>

              {state.showDbList && state.dbHistory.length > 0 && (
                <ul className="history-dropdown">
                  {state.dbHistory.map((db, i) => {
                    const dbName = typeof db === 'string' ? db : (db?.database || '');
                    if (!dbName || dbName === '[object Object]') return null;
                    return (
                      <li key={i} onClick={() => { actions.setDatabase(dbName); actions.setShowDbList(false); }}>
                        {dbName}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {state.error && <div className="modal-error">{state.error}</div>}
          {state.successMsg && <div className="modal-success">{state.successMsg}</div>}
          
          <div className="modal-footer">
            <button type="button" className="btn-test" onClick={actions.handleTest} disabled={state.isTesting || !state.server || !state.database}>
              <Activity size={18} /> {state.isTesting ? 'Testando...' : 'Testar Conexão'}
            </button>
            <button type="button" className="btn-save" onClick={actions.handleSave} disabled={!state.server || !state.database}>
              <Zap size={18} /> {connection.isConnected ? 'Atualizar Conexão' : 'Conectar Agora'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConnectionModal;