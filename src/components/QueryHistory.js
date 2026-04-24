import React, { useState } from 'react';

const QueryHistory = ({ history, onClose, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtra o histórico com base no que o usuário digitar na busca
  const filteredHistory = history.filter(item => 
    item.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="history-modal" onClick={e => e.stopPropagation()}>
        
        {/* HEADER DO HISTÓRICO */}
        <div className="history-header">
          <div>
            <h3 className="history-title">🕒 Histórico de Validações</h3>
            <span className="history-count">{history.length}/200 Queries salvas</span>
          </div>
          <button className="btn-close-modal" onClick={onClose} title="Fechar Histórico">
            &times;
          </button>
        </div>

        {/* BARRA DE BUSCA */}
        <div className="history-search">
          <span style={{ fontSize: '18px' }}>🔍</span>
          <input 
            type="text" 
            className="history-search-input"
            placeholder="Buscar por nome da tabela, ID, valores..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        {/* LISTA DE QUERIES */}
        <div className="history-list">
          {filteredHistory.length === 0 ? (
            <div className="history-empty">
              📭 Nenhuma query encontrada com esses termos.
            </div>
          ) : (
            filteredHistory.map((item, index) => (
              <div key={index} className="history-item fade-in">
                <div className="history-item-header">
                  <span className="history-time">Validado às {item.time}</span>
                  <button className="btn-modern btn-validate" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => onSelect(item.query)}>
                    📋 Copiar Query
                  </button>
                </div>
                <pre className="history-code">
                  {item.query}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default QueryHistory;