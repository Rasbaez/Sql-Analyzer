// 💻 src/components/QueryHistory.js

import React from 'react';
import { X, Clock, Copy, CheckCircle2 } from 'lucide-react';

const QueryHistory = ({ history, onClose, onSelect }) => {
  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div className="modal-container history-modal" onClick={e => e.stopPropagation()}>
        
        {/* CABEÇALHO DO MODAL */}
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="#38bdf8" /> Histórico de Validações
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* LISTA DE HISTÓRICO */}
        <div className="history-list-container">
          {history.length === 0 ? (
            <div className="history-empty">
              Nenhuma query validada e aprovada pela IA até o momento.
            </div>
          ) : (
            history.map((item, index) => {
              // Retrocompatibilidade caso o history antigo tenha salvo apenas strings
              const isObject = typeof item === 'object';
              const queryText = isObject ? item.query : item;
              const queryTime = isObject ? item.timestamp : 'Data desconhecida';

              return (
                <div key={isObject ? item.id : index} className="history-card fade-in">
                  <div className="history-card-header">
                    <span className="history-time">{queryTime}</span>
                    <span className="history-badge">
                      <CheckCircle2 size={14} /> Validado por IA
                    </span>
                  </div>
                  
                  <pre className="history-code">{queryText}</pre>
                  
                  <div className="history-actions">
                    <button 
                      className="btn-outline-blue history-btn" 
                      onClick={() => onSelect(queryText)}
                    >
                      <Copy size={14} /> Restaurar Query
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
      </div>
    </div>
  );
};

export default QueryHistory;