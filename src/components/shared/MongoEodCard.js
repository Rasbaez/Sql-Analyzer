// 📦 src/components/shared/MongoEodCard.js
import React, { useState } from 'react';
import { Clock, Hash, Copy, AlertCircle, CheckCircle, FileJson, PackageOpen, Check } from 'lucide-react';

const MongoEodCard = ({ eod, onOpenJson, onCopyEod }) => {
  const hasErrors = eod.alerts?.length > 0;
  const { GPID, trip, liq, ts, ordersQty, totalOfItems } = eod.extracted || {};

  // 🔥 Estados para controlar a animação visual de "Copiado"
  const [copiedTxt, setCopiedTxt] = useState(false);
  const [copiedMuid, setCopiedMuid] = useState(false);

  // Animação de copiar o resumo TXT
  const handleCopyTxt = () => {
    onCopyEod(eod);
    setCopiedTxt(true);
    setTimeout(() => setCopiedTxt(false), 2000); // Volta ao normal em 2s
  };

  // Animação e fallback de copiar o MUID
  const handleCopyMuid = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(eod.cMessageUniqueID).catch(()=>{});
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = eod.cMessageUniqueID;
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try { document.execCommand('copy'); } catch(err){}
      document.body.removeChild(textArea);
    }
    setCopiedMuid(true);
    setTimeout(() => setCopiedMuid(false), 2000);
  };

  return (
    <div className="mongo-invoice-card" style={{ margin: 0, width: '100%', display: 'flex', flexDirection: 'column' }}>
      
      <div className="mongo-card-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div className="mongo-header-id">
          <strong>Liquidate: {liq || eod.cIDLiquidate}</strong>
          <span className="mongo-divider">|</span>
          <span>Trip: {trip || '-'}</span>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* 🔥 BOTÃO DE COPIAR TXT (COM ANIMAÇÃO VISUAL) */}
          <button 
            className="view-details-btn" 
            onClick={handleCopyTxt}
            style={{ 
              background: copiedTxt ? '#059669' : '#1e293b', 
              border: copiedTxt ? '1px solid #10b981' : '1px solid #475569', 
              color: '#f8fafc', 
              display: 'flex', alignItems: 'center', gap: '5px',
              transition: 'all 0.3s'
            }}
          >
            {copiedTxt ? <Check size={14} color="#fff" /> : <Copy size={14} color="#38bdf8" />} 
            {copiedTxt ? 'Copiado!' : 'Copiar TXT'}
          </button>
          
          <button className="view-details-btn" onClick={() => onOpenJson(eod)}>
            <FileJson size={14} /> Ver JSON Full
          </button>
        </div>
      </div>
      
      <div className="mongo-card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between' }}>
        <div className="mongo-info-block">
          <span className="mongo-info-label"><PackageOpen size={13}/> Danfinhas / Itens</span>
          <span className="mongo-val-text">{ordersQty || 0} un / {totalOfItems || 0} un</span>
        </div>
        <div className="mongo-info-block">
          <span className="mongo-info-label"><Clock size={13}/> TimeStamp</span>
          <span className="mongo-date-text">{ts || 'N/A'}</span>
        </div>
        <div className="mongo-info-block" style={{ flexGrow: 1 }}>
          <span className="mongo-info-label"><Hash size={13}/> MUID</span>
          <div className="mongo-muid-container" style={{ width: '100%' }}>
            <span className="mongo-muid-text">{eod.cMessageUniqueID}</span>
            
            {/* 🔥 BOTÃO DE COPIAR MUID (COM ANIMAÇÃO VISUAL) */}
            <button className="mongo-copy-btn" onClick={handleCopyMuid}>
              {copiedMuid ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>
      
      <div className={`mongo-card-footer ${hasErrors ? 'mongo-footer-error' : 'mongo-footer-success'}`}>
         {hasErrors ? (
           eod.alerts.map((al, i) => <div key={i} className="flex-align-center text-error" style={{marginBottom: '5px'}}><AlertCircle size={14} /> {al.msg}</div>)
         ) : (
           <div className="text-success flex-align-center"><CheckCircle size={14} /> EOD validado sem erros estruturais</div>
         )}
      </div>
    </div>
  );
};

export default MongoEodCard;