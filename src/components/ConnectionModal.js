import React from 'react';
import { Database, Server, Zap, X, Activity, ChevronDown } from 'lucide-react';
import { useConnectionModal } from '../hooks/useConnectionModal'; // 🔥 Importando o novo Hook
import './componentsCss/ConnectionModal.css';

const ConnectionModal = ({ isOpen, onClose, onSave }) => {
  // Chamada do hook passando as props necessárias
  const { state, refs, actions } = useConnectionModal(isOpen, onClose, onSave);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}><X size={22} /></button>
        
        <div className="modal-header">
          <div className="modal-icon-wrapper"><Database size={32} color="#38bdf8" /></div>
          <h2 className="modal-title">Configurar Ambiente</h2>
        </div>

        <form>
          {/* CAMPO SERVIDOR */}
          <div className="input-group" ref={refs.serverRef}>
            <label className="input-label"><Server size={14} color="#38bdf8" /> Servidor</label>
            <div className="custom-select-wrapper">
              <input 
                type="text" 
                className="input-field"
                value={state.server} 
                onChange={(e) => { actions.setServer(e.target.value); actions.setShowServerList(true); }}
                onFocus={() => actions.setShowServerList(true)}
                placeholder="Selecione ou digite..."
              />
              <button type="button" className="dropdown-arrow" onClick={() => actions.setShowServerList(!state.showServerList)}>
                <ChevronDown size={16} />
              </button>
              
              {state.showServerList && state.serverHistory.length > 0 && (
                <ul className="history-dropdown">
                  {state.serverHistory.map((s, i) => (
                    <li key={i} onClick={() => { actions.setServer(s); actions.setShowServerList(false); }}>{s}</li>
                  ))}
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
                value={state.database} 
                onChange={(e) => { actions.setDatabase(e.target.value); actions.setShowDbList(true); }}
                onFocus={() => actions.setShowDbList(true)}
                placeholder="Selecione ou digite..."
              />
              <button type="button" className="dropdown-arrow" onClick={() => actions.setShowDbList(!state.showDbList)}>
                <ChevronDown size={16} />
              </button>

              {state.showDbList && state.dbHistory.length > 0 && (
                <ul className="history-dropdown">
                  {state.dbHistory.map((db, i) => (
                    <li key={i} onClick={() => { actions.setDatabase(db); actions.setShowDbList(false); }}>{db}</li>
                  ))}
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
              <Zap size={18} /> Salvar Conexão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConnectionModal;