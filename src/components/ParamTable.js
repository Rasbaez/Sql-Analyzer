// 💻 src/components/ParamTable.js

import React, { useState } from 'react';

const ParamTable = React.memo(({ data, t }) => {
  const [expandedSub, setExpandedSub] = useState({});
  const toggleSub = (key) => setExpandedSub(prev => ({ ...prev, [key]: !prev[key] }));

  const renderValue = (val, key) => {
    if (val === undefined || val === null) return <i style={{ color: '#94a3b8' }}>NULL</i>;
    
    if (val === "''" || val === "" || String(val).trim() === "") {
      return (
        <code style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
          '' (Vazio)
        </code>
      );
    }
    
    if (typeof val === 'object' && val !== null) {
      if (val.tipo === "SUBQUERY") {
        const isExpanded = expandedSub[key];
        return (
          <div className="subquery-wrapper fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#a855f7', fontWeight: 'bold' }}>🔎 SUBQUERY</span>
              <button 
                onClick={() => toggleSub(key)} 
                style={{ padding: '2px 8px', fontSize: '10px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #a855f7', background: 'transparent', color: '#a855f7' }}
              >
                {isExpanded ? 'Fechar' : 'Ver SQL'}
              </button>
            </div>
            {isExpanded && <pre style={{ background: '#000', padding: '8px', borderRadius: '6px', color: '#a855f7', fontSize: '11px', marginTop: '5px', overflowX: 'auto' }}>{val.valorOriginal}</pre>}
          </div>
        );
      }
      
      if (val.tipo === "LIST") {
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {(val.valor || "").split(',').map((item, i) => (
              <span key={i} style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                {item.trim()}
              </span>
            ))}
          </div>
        );
      }

      // Trava de segurança: se a IA retornar um objeto JSON não mapeado, exibe como string em vez de quebrar a tela
      return <span style={{ color: '#f1f5f9', fontSize: '13px' }}>{JSON.stringify(val)}</span>;
    }
    
    return <span style={{ color: '#f1f5f9', fontSize: '13px', fontFamily: '"Fira Code", monospace' }}>{String(val)}</span>;
  };

  // Se a IA não enviar parâmetros (objeto vazio), a tabela não renderiza
  if (!data || Object.keys(data).length === 0) return null;

  return (
    <div className="param-table-container fade-in">
      <table className="param-table-full">
        <thead>
          <tr>
            <th style={{ width: '30%' }}>Coluna / Referência</th>
            <th>Valor Detectado</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data).map(([k, v]) => (
            <tr key={k}>
              <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>{k}</td>
              <td>{renderValue(v, k)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default ParamTable;