// 💻 src/components/ParamTable.js

import React, { useState } from 'react';

const ParamTable = React.memo(({ data, t }) => {
  const [expandedSub, setExpandedSub] = useState({});
  const toggleSub = (key) => setExpandedSub(prev => ({ ...prev, [key]: !prev[key] }));

  const renderValue = (val, key) => {
    if (val === undefined || val === null) return "NULL";
    if (val === "''" || val === "" || String(val).trim() === "") return <code className="empty-val">''</code>;
    
    if (typeof val === 'object' && val.tipo === "SUBQUERY") {
      const isExpanded = expandedSub[key];
      return (
        <div className="subquery-wrapper fade-in">
          <div className="subquery-control">
            <span className="subquery-label">🔎 {t('label_subquery')}</span>
            <button onClick={() => toggleSub(key)} className={`btn-sub-toggle ${isExpanded ? 'active' : ''}`}>
              {isExpanded ? t('btn_close') : t('btn_view')}
            </button>
          </div>
          {isExpanded && <div className="subquery-reveal"><pre className="subquery-code-block">{val.valorOriginal}</pre></div>}
        </div>
      );
    }
    
    if (typeof val === 'object' && val.tipo === "LIST") {
      return (
        <div className="list-wrapper">
          {(val.valor || "").split(',').map((item, i) => (
            <span key={i} className="list-tag">{item.trim()}</span>
          ))}
        </div>
      );
    }
    
    return <span className="final-val">{String(val)}</span>;
  };

  return (
    <table className="params-table">
      <thead>
        <tr>
          <th>{t('col_column')}</th>
          <th>{t('col_value')}</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(data).map(([k, v]) => (
          <tr key={k}>
            <td className="td-field"><strong>{k}</strong></td>
            <td className="td-value">{renderValue(v, k)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
});

export default ParamTable;