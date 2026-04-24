import React, { useState } from 'react';
import { FileSpreadsheet, Play, CheckCircle, Download, AlertTriangle, Database, XOctagon, FileWarning } from 'lucide-react';
// 🔥 Importação correta do Hook!
import { useMassiveExtractor } from '../hooks/useMassiveExtractor';
import MongoConnectionModal from './MongoConnectionModal'; 

const MassiveInvoiceExtractor = () => {
  const {
    isProcessing,
    isDone,
    progress,
    results,
    removeScript,
    error,
    processMassiveFile,
    handleCancel,
    downloadResultsCSV, // A função vem pelo Hook!
    downloadRemoveScript
  } = useMassiveExtractor();

  const [isMongoModalOpen, setIsMongoModalOpen] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const mongoServer = localStorage.getItem('mongo_server');
      if (!mongoServer) {
        alert("⚠️ Por favor, configure a conexão do MongoDB primeiro!");
        setIsMongoModalOpen(true);
        e.target.value = null;
        return;
      }
      processMassiveFile(file);
    }
    e.target.value = null; 
  };

  return (
    <div className="automation-card" style={{ padding: '20px', background: '#1e293b', borderRadius: '10px', border: '1px solid #334155' }}>
      
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileSpreadsheet color="#38bdf8" size={28} />
          <h3 style={{ margin: 0, color: '#f8fafc' }}>Extrator Massive Invoice</h3>
        </div>
        
        <button 
          onClick={() => setIsMongoModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid #10b981', color: '#10b981', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
        >
          <Database size={16} /> Configurar MongoDB
        </button>
      </div>

      {error && (
        <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '10px', borderRadius: '6px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {!isProcessing && !isDone && (
        <div style={{ textAlign: 'center', padding: '30px', border: '2px dashed #334155', borderRadius: '8px', marginBottom: '20px' }}>
          <FileSpreadsheet size={48} color="#475569" style={{ marginBottom: '10px' }} />
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '15px' }}>
            Faça upload de uma planilha XLSX com as colunas:<br/> <strong>cSerie</strong>, <strong>cidBranchinvoice</strong> e <strong>cidInvoice</strong>.
          </p>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0284c7', color: '#fff', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Play size={18} /> Iniciar Processamento
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      )}

      {isProcessing && (
        <div className="progress-container" style={{ background: '#0f172a', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
            <div>
              <div style={{ color: '#38bdf8', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>Lendo MongoDB em Lotes...</div>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>Aguarde, processando {progress}%</div>
            </div>
            <button onClick={handleCancel} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
              <XOctagon size={14} /> Interromper
            </button>
          </div>
          <div style={{ width: '100%', background: '#334155', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, background: '#38bdf8', height: '100%', transition: 'width 0.3s ease' }}></div>
          </div>
        </div>
      )}

      {/* 🔥 PRÉ-VISUALIZAÇÃO DOS DADOS NA TELA */}
      {(isProcessing || isDone) && results.length > 0 && (
        <div style={{ background: '#0f172a', padding: '15px', borderRadius: '8px', marginBottom: '20px', overflowX: 'auto' }}>
          <h4 style={{ color: '#38bdf8', margin: '0 0 10px 0', fontSize: '14px' }}>Pré-visualização ({results.length} notas extraídas)</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#cbd5e1', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '8px' }}>NFe</th>
                <th style={{ padding: '8px' }}>CDV</th>
                <th style={{ padding: '8px' }}>Série</th>
                <th style={{ padding: '8px' }}>MUID</th>
                <th style={{ padding: '8px' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {results.slice(0, 5).map((r, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '8px', color: '#fff' }}>{r.cIDInvoice}</td>
                  <td style={{ padding: '8px' }}>{r.cIDBranchInvoice}</td>
                  <td style={{ padding: '8px' }}>{r.cSerie}</td>
                  <td style={{ padding: '8px', fontFamily: 'monospace', color: '#10b981' }}>{r.MUID}</td>
                  <td style={{ padding: '8px' }}>{r.TIMESTAMP}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {results.length > 5 && <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', marginTop: '10px' }}>...e mais {results.length - 5} registros ocultos. Baixe o arquivo para ver todos.</div>}
        </div>
      )}

      {isDone && results.length === 0 && (
        <div style={{ background: '#451a03', color: '#fcd34d', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #d97706', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileWarning size={24} />
          <div>
            <h4 style={{ margin: 0, fontSize: '14px' }}>Nenhuma nota encontrada!</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>O processo varreu sua planilha, mas o MongoDB retornou 0 resultados. Verifique se as notas pertencem ao servidor e database configurados.</p>
          </div>
        </div>
      )}

      {isDone && (
        <div className="success-area" style={{ background: '#064e3b', padding: '15px', borderRadius: '8px', border: '1px solid #059669' }}>
          {results.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 'bold', marginBottom: '15px' }}>
                <CheckCircle size={20} /> Processamento Finalizado! Baixe seus arquivos.
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={downloadResultsCSV} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#10b981', border: 'none', padding: '10px', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <Download size={16} /> Baixar Relatório (CSV)
                </button>
                <button onClick={downloadRemoveScript} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#ef4444', border: 'none', padding: '10px', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <Download size={16} /> Script de Remoção (TXT)
                </button>
              </div>
            </>
          )}

          <label style={{ display: 'block', textAlign: 'center', marginTop: '15px', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>
            Processar nova planilha
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      )}

      <MongoConnectionModal 
        isOpen={isMongoModalOpen} 
        onClose={() => setIsMongoModalOpen(false)} 
        onSave={() => setIsMongoModalOpen(false)} 
      />

    </div>
  );
};

export default MassiveInvoiceExtractor;