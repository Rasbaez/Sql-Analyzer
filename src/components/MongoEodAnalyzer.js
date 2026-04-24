// 📊 src/components/MongoEodAnalyzer.js
import React, { useState, useEffect } from 'react';
import { Database, Search, AlertCircle, Cpu, XCircle, Trash2, Folder, ChevronRight, FileJson, FileText, Copy, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import MongoEodCard from './shared/MongoEodCard';
import MongoConnectionModal from './MongoConnectionModal'; 
import { validateEodData } from '../utils/helpers/eodHelpers';
import { useApp } from '../context/AppContext'; // 🔥 Pegamos o AppContext para usar o showToast
import './componentsCss/MongoEodAnalyzer.css';

const MongoEodAnalyzer = () => {
  const { showToast } = useApp(); // 🔥 Usaremos o Toast no lugar do Alert para não perder o foco!
  
  const [isMongoModalOpen, setIsMongoModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const [inputLiquidates, setInputLiquidates] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [missingLiquidates, setMissingLiquidates] = useState([]);
  
  const [selectedJsonData, setSelectedJsonData] = useState(null);
  const [jsonSearchTerm, setJsonSearchTerm] = useState(''); 
  const [isCopiedAll, setIsCopiedAll] = useState(false); 

  useEffect(() => {
    checkMongoConnection();
  }, []);

  const checkMongoConnection = () => {
    const server = localStorage.getItem('mongo_server');
    setIsConnected(!!server); 
  };

  const handleSaveMongoConnection = () => {
    checkMongoConnection();
    setIsMongoModalOpen(false);
  };

  const handleSearch = async () => {
    if (!inputLiquidates.trim()) return;

    const liquidatesArray = inputLiquidates
      .split(/[\s,;\n]+/)
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (liquidatesArray.length === 0) return;

    setLoading(true);
    setResults([]);
    setMissingLiquidates([]);

    const mongoConfig = {
      server: localStorage.getItem('mongo_server'),
      database: localStorage.getItem('mongo_db') || 'MDB_PEPSICO_BR',
      user: localStorage.getItem('mongo_user'),
      password: localStorage.getItem('mongo_pass')
    };

    if (!mongoConfig.server) {
      if (showToast) showToast("Configure o MongoDB primeiro!", "warning");
      setIsMongoModalOpen(true);
      setLoading(false);
      return;
    }

    try {
      const res = await window.electronAPI.getMongoEods(
        mongoConfig,
        { cIDLiquidate: liquidatesArray, cIDCompany: '0546' },
        'EndofDayExport' 
      );

      if (res.success) {
        const eodsValidados = res.data.map(eod => validateEodData(eod));
        setResults(eodsValidados);

        const encontrados = res.data.map(eod => eod.cIDLiquidate);
        const faltantes = liquidatesArray.filter(liq => !encontrados.includes(liq));
        setMissingLiquidates(faltantes);
      } else {
        if (showToast) showToast(`Erro: ${res.error}`, "error");
      }
    } catch (err) {
      console.error("🚨 ERRO:", err);
      if (showToast) showToast(`Erro Crítico: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInputLiquidates('');
    setResults([]);
    setMissingLiquidates([]);
  };


//Função de cópia blindada e silenciosa
  const safeCopyToClipboard = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopyTextToClipboard(text));
    } else {
      fallbackCopyTextToClipboard(text);
    }
  };

const fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; 
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try { document.execCommand('copy'); } catch (err) { console.error(err); }
    document.body.removeChild(textArea);
  };



  // 🔥 Formata 1 EOD e Copia (Individual)
  const handleCopySingleTxt = (eod) => {
    const { GPID, trip, liq, ordersQty, totalOfItems } = eod.extracted || {};
    const isoTime = eod.mc1LastUpdate ? new Date(eod.mc1LastUpdate).toISOString() : 'N/A';
    const text = `Danfinhas: ${ordersQty || 0} Items(un): ${totalOfItems || 0}\nTourID: ${trip || '-'} Liquidate: ${liq || eod.cIDLiquidate}\nTimeStamp: ${isoTime} -- User: ${GPID || ''}\nMUID: ${eod.cMessageUniqueID}\n`;
    safeCopyToClipboard(text);
  };

// 🔥 Formata TODOS e dispara a animação visual do botão "Copiar Todos"
  const handleCopyAllTxt = () => {
    if (results.length === 0) return;
    const textToCopy = results.map(eod => {
      const { GPID, trip, liq, ordersQty, totalOfItems } = eod.extracted || {};
      const isoTime = eod.mc1LastUpdate ? new Date(eod.mc1LastUpdate).toISOString() : 'N/A';
      return `Danfinhas: ${ordersQty || 0} Items(un): ${totalOfItems || 0}\nTourID: ${trip || '-'} Liquidate: ${liq || eod.cIDLiquidate}\nTimeStamp: ${isoTime} -- User: ${GPID || ''}\nMUID: ${eod.cMessageUniqueID}\n`;
    }).join('\n');
    
    safeCopyToClipboard(textToCopy);
    
    setIsCopiedAll(true); // Fica verde
    setTimeout(() => setIsCopiedAll(false), 2000); // Volta ao azul depois de 2s
  };

  return (
    <div className="route-analyzer-container" style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
      
      {/* O BLOCÃO MESTRE (Agora inclui a barra de ações de resultados!) */}
      <div className="eod-master-panel">
        
        <div className="eod-panel-header">
          <div className="eod-title-section">
            <FileText size={26} color="#f8fafc" />
            <h2>Validador de EOD em Lote</h2>
          </div>
          
          <div className="eod-path-badge">
            <Database size={14} style={{ color: '#10b981' }}/> MDB_PEPSICO_BR
            <ChevronRight size={14} className="eod-path-sep" />
            <Folder size={14} color="#10b981" /> <span style={{ marginLeft: '4px' }}>EndofDayExport</span>
          </div>

          <button 
            className={`eod-mongo-connect-btn ${isConnected ? 'connected' : ''}`}
            onClick={() => setIsMongoModalOpen(true)}
          >
            <Database size={16} />
            {isConnected ? 'Conectado' : 'Conectar Mongo'}
          </button>
        </div>

        <div className="eod-search-area">
          <label>Cole os IDs de Liquidate (separados por vírgula, espaço ou linha):</label>
          <textarea 
            className="eod-textarea"
            rows={4}
            value={inputLiquidates}
            onChange={(e) => setInputLiquidates(e.target.value)}
            placeholder="Ex: 10427375&#10;10427376&#10;10427377..."
          />
          
          <div className="eod-actions-wrapper">
            <button className="eod-btn-clear" onClick={handleClear} disabled={loading}>
              <Trash2 size={16} /> Limpar
            </button>
            <button className="eod-btn-search" onClick={handleSearch} disabled={loading}>
              {loading ? <Cpu size={16} className="spin-animation" /> : <Search size={16} />} 
              {loading ? 'Consultando...' : 'Validar EODs'}
            </button>
          </div>
        </div>

        {/* 🔥 BARRA DE AÇÕES (DENTRO DO BLOCÃO PRINCIPAL AGORA) */}
        {results.length > 0 && (
          <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckSquare size={16} color="#10b981" />
              Foram encontrados <strong style={{ color: '#38bdf8' }}>{results.length}</strong> documentos.
            </span>
           <button 
    onClick={handleCopyAllTxt} 
    style={{ 
      background: isCopiedAll ? '#059669' : '#0ea5e9', 
      border: 'none', 
      color: '#f8fafc', 
      padding: '8px 16px', 
      borderRadius: '6px', 
      display: 'flex', alignItems: 'center', gap: '8px', 
      cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
      transition: 'all 0.3s'
    }}
  >
    {isCopiedAll ? <CheckSquare size={16} /> : <Copy size={16} />} 
    {isCopiedAll ? 'Copiado para a Área de Transferência!' : 'Copiar Todos (Resumo TXT)'}
  </button>
          </div>
        )}

      </div>

      {missingLiquidates.length > 0 && (
        <div className="alert-box warning" style={{ padding: '15px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', borderRadius: '8px', color: '#fcd34d', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ display: 'block', marginBottom: '5px' }}>Os seguintes Liquidates não foram localizados no banco:</strong>
            <span style={{ fontFamily: 'monospace' }}>{missingLiquidates.join(', ')}</span>
          </div>
        </div>
      )}

      {/* 🔥 GRID DE RESULTADOS OCUPANDO 100% DA TELA (1 Coluna) */}
      {results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', paddingBottom: '30px' }}>
          <AnimatePresence>
            {results.map((eod) => (
              <motion.div 
                key={eod.cMessageUniqueID}
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9 }}
                layout
              >
                <MongoEodCard 
                  eod={eod} 
                  onOpenJson={(eodObj) => setSelectedJsonData(eodObj)} 
                  onCopyEod={handleCopySingleTxt} // 🔥 Passa a função individual pro Card
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* MODAL MAC OS COM BARRA DE BUSCA JSON */}
      <AnimatePresence>
        {selectedJsonData && (
          <motion.div 
            className="ide-modal-overlay" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => { setSelectedJsonData(null); setJsonSearchTerm(''); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
          >
            <motion.div 
              className="ide-modal-window" 
              style={{ maxWidth: '950px', width: '90%', border: '1px solid #334155', borderRadius: '10px', overflow: 'hidden', background: '#0d1117', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }} 
              onClick={e => e.stopPropagation()} 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }}
            >
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#1e293b', borderBottom: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div onClick={() => { setSelectedJsonData(null); setJsonSearchTerm(''); }} style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#ff5f56', cursor: 'pointer', boxShadow: 'inset 0 0 4px rgba(0,0,0,0.2)' }} title="Fechar" />
                    <div style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#ffbd2e', boxShadow: 'inset 0 0 4px rgba(0,0,0,0.2)' }} />
                    <div style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#27c93f', boxShadow: 'inset 0 0 4px rgba(0,0,0,0.2)' }} />
                  </div>
                  <span style={{ color: '#e2e8f0', fontSize: '13px', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileJson size={15} color="#38bdf8" />
                    MUID: {selectedJsonData.cMessageUniqueID}
                  </span>
                </div>

                <div style={{ position: 'relative', width: '250px' }}>
                  <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Buscar no JSON..."
                    value={jsonSearchTerm}
                    onChange={(e) => setJsonSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px 6px 32px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '12px', outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' }}
                  />
                  {jsonSearchTerm && (
                    <XCircle size={14} color="#94a3b8" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} onClick={() => setJsonSearchTerm('')} />
                  )}
                </div>
              </div>
              
              <div style={{ padding: '20px', maxHeight: '75vh', overflowY: 'auto', background: '#0d1117' }}>
                <pre style={{ color: '#a5b4fc', fontSize: '13.5px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, fontFamily: "'Consolas', 'Courier New', monospace", lineHeight: '1.5' }}>
                  {(() => {
                    const jsonString = JSON.stringify(selectedJsonData.parsedJson, null, 2);
                    if (!jsonSearchTerm) return jsonString;
                    const parts = jsonString.split(new RegExp(`(${jsonSearchTerm})`, 'gi'));
                    return parts.map((part, index) => 
                      part.toLowerCase() === jsonSearchTerm.toLowerCase() ? (
                        <mark key={index} style={{ backgroundColor: '#facc15', color: '#0f172a', borderRadius: '2px', padding: '0 2px', fontWeight: 'bold' }}>{part}</mark>
                      ) : part
                    );
                  })()}
                </pre>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isMongoModalOpen && (
        <MongoConnectionModal 
          isOpen={isMongoModalOpen} 
          onClose={() => setIsMongoModalOpen(false)} 
          onSave={handleSaveMongoConnection}
        />
      )}

    </div>
  );
};

export default MongoEodAnalyzer;