// 💻 src/components/shared/MongoInvoiceCard.js
import React from 'react';
import { Clock, Hash, DollarSign, Copy, AlertCircle, CheckCircle, FileJson } from 'lucide-react';

const MongoInvoiceCard = ({ nf, onOpenJson }) => {
  const isAtiva = nf.parsedJson?.NFE_STS !== 'AS';
  const hasErrors = nf.alerts?.length > 0;

  const formatarData = (dataStr) => {
    if (!dataStr) return '---';
    const dataObj = new Date(dataStr);
    return isNaN(dataObj) ? dataStr : dataObj.toLocaleString('pt-BR');
  };

  return (
    <div className="mongo-invoice-card" style={{ margin: 0, width: '100%' }}>
      <div className="mongo-card-header">
        <div className="mongo-header-id">
          <strong>NF: {nf.cIDInvoice}</strong>
          <span className="mongo-divider">|</span>
          <span>CDV: {nf.cIDBranchInvoice}</span>
          <span className={`mongo-status-badge ${isAtiva ? 'mongo-status-active' : 'mongo-status-inactive'}`}>
            {isAtiva ? 'Nota Ativa' : 'Nota Inativa'}
          </span>
        </div>
        <button className="view-details-btn" onClick={() => onOpenJson(nf)}>
          <FileJson size={16} /> Ver JSON Full
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
      
      <div className={`mongo-card-footer ${hasErrors ? 'mongo-footer-error' : 'mongo-footer-success'}`}>
         {hasErrors ? (
           nf.alerts.map((al, i) => <div key={i} className="flex-align-center text-error"><AlertCircle size={14} /> {al.msg}</div>)
         ) : (
           <div className="text-success flex-align-center"><CheckCircle size={14} /> Integração Perfeita</div>
         )}
      </div>
    </div>
  );
};

export default MongoInvoiceCard;