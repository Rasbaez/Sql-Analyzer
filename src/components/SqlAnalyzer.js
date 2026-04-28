// 💻 src/components/SqlAnalyzer.js

import React from 'react';
import './componentsCss/SqlAnalyzer.css';
import { useSqlAnalyzer } from '../hooks/useSqlAnalyzer';
import QueryHistory from './QueryHistory';
import { exportarRelatorioPDF } from '../utils/pdfGenerator';
import { formatSqlValue } from '../utils/data';
import { Database, Sparkles, Bot, CheckCircle2, AlertTriangle, ShieldCheck, Download, StopCircle, FileText } from 'lucide-react'; 
import ConnectionModal from './ConnectionModal';
import ParamTable from './ParamTable'; 

const SqlAnalyzer = () => {
  const {
    t, i18n, sql, setSql, response, setResponse, loading, stats, history, 
    showHistory, setShowHistory, showCopyPopup, selectStatus, setSelectStatus,
    checklist, setChecklist, parsedData, setParsedData, modalOpen, setModalOpen,
    modalData, modalLoading, modalError, dbAtual, setDbAtual, serverAtual, setServerAtual,
    isConnectionModalOpen, setIsConnectionModalOpen,
    handleExtract, handleCancelQuery, handleExecuteSelect, copyToClipboard, resetChecklist,
    downloadSqlFile, aiModelUsed
  } = useSqlAnalyzer();

const hasPassedAI = !!response?.autoFix?.fixed; // True se a IA gerou um código
const isFullyValidated = checklist.tableOk && checklist.whereOk && hasPassedAI;


  return (
    <div className="analyzer-page">
      {showCopyPopup && (
        <div className="copy-popup fade-in">
          <span>📋 {t('copy_success', 'Copiado com sucesso!')}</span>
        </div>
      )}
      
      <div className="analyzer-container fade-in">
        
        {/* HEADER */}
        <div className="analyzer-header">
          <div className="header-content-right">
            <h2 className="header-title">ENTERPRISE ANALYZER</h2>
          </div>
        </div>

        {/* INPUT PROMPT IA */}
        <div className="ai-prompt-section">
          <label className="textarea-titleorign title-blue">
            <Bot size={18} /> ✨ Prompt Assistido por IA (Gemini Enterprise)
          </label>
          <textarea 
            value={sql} 
            onChange={(e) => setSql(e.target.value)} 
            className={`ai-textarea ${stats.hasCritical ? 'input-error' : ''}`} 
            placeholder="Analise sua query SQL Server ou comando MongoDB aqui. A IA irá validar, corrigir e auditar conforme as regras de negócio da PepsiCo e melhores práticas de DBA." 
          />
        </div>

        {/* BARRA DE BOTÕES PRINCIPAIS */}
        <div className="button-container" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button className="btn-modern btn-clear" onClick={() => { 
              setSql(''); setResponse(null); 
              setParsedData({ update: {}, where: {}, insert: {}, delete: {} }); 
              resetChecklist(); setSelectStatus('pending'); 
            }}>
              Limpar
            </button>

            <button className="btn-modern btn-ai-sparkle" onClick={handleExtract} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-small"></span> 
                  🧠 {sql.includes(';') ? 'Processando Lote de Queries...' : 'Gemini Analisando...'}
                </>
              ) : (
                <><Sparkles size={18} /> Run Analyzer (IA)</>
              )}
            </button>

            <button className="btn-modern btn-history" onClick={() => setShowHistory(true)}>
              Histórico ({history.length})
            </button>
          </div>

          {aiModelUsed && !loading && (
             <div style={{ alignSelf: 'center', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
                <Bot size={14} color="#38bdf8" /> Analisado de forma segura usando <strong>{aiModelUsed.replace('gemini-', 'Gemini ')}</strong>
             </div>
          )}
        </div>

        {/* RESULTADOS DA IA */}
        {response && (
          <div className="result-area fade-in">
            
            {/* PAINEL DE AUDITORIA DINÂMICO */}
            <div className="auditory-panel" style={{ marginBottom: '25px' }}>
              
              {/* ERROS CRÍTICOS (Apenas se existirem) */}
              {response.criticalErrors?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                  {response.criticalErrors.map((err, i) => (
                    <div key={i} className="alert-item alert-danger fade-in" style={{ margin: 0 }}>
                      <AlertTriangle size={20} />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* MENSAGEM DE SUCESSO (Se não houver erros críticos) */}
              {stats.isSyntaxOk && (!response.criticalErrors || response.criticalErrors.length === 0) && (
                <div className="alert-item alert-success fade-in" style={{ margin: '0 0 15px 0' }}>
                  <ShieldCheck size={20} />
                  <span><strong>Status OK:</strong> Código validado e regras de negócio aprovadas!</span>
                </div>
              )}

              {/* RELATÓRIO DE SINTAXE (Resumo em Texto) */}
              {response.auditReport && (
                <div className="audit-summary-card fade-in" style={{ 
                  background: 'rgba(56, 189, 248, 0.05)', 
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  padding: '15px 20px',
                  borderRadius: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>
                    <FileText size={16} /> RELATÓRIO DE ALTERAÇÕES DA IA
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '13.5px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {response.auditReport}
                  </div>
                </div>
              )}

            </div>

            {/* CARDS DE SQL (Só mostra se a IA gerou correção) */}
            {response.autoFix?.fixed && (
              <div className="dashboard-grid">
                
                {/* CARD 1: QUERY CORRIGIDA */}
                <div className="result-card main-suggestion">
                  <div className="card-header-flex">
                    <label className={`textarea-titleorign ${stats.hasCritical ? 'text-warning' : 'text-success'}`}>
                      <CheckCircle2 size={16} /> Query Sintaticamente Corrigida (Pela IA)
                    </label>
                    <button className="btn-outline-green" onClick={() => copyToClipboard(response.autoFix.fixed)}>
                      📋 Copiar SQL
                    </button>
                  </div>
                  <textarea value={response.autoFix.fixed} readOnly className="sql-input suggestion-mode green-text" />
                </div>

                {/* CARD 2: TESTE DE IMPACTO */}
                {response.selectPreview && (
                  <div className="result-card preview-card">
                    <div className="card-header-flex" style={{ flexWrap: 'wrap', gap: '10px' }}>
                      <label className="textarea-titleorign title-blue">
                        🔍 Teste de Impacto (SELECT)
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="connection-pill" onClick={() => setIsConnectionModalOpen(true)}>
                          <Database size={14} /> {dbAtual || "Conectar Banco"}
                        </button>
                        <button 
                          className="btn-outline-green" 
                          style={{ borderColor: '#818cf8', color: '#818cf8' }}
                          onClick={() => downloadSqlFile(response.selectPreview, `MC1_ImpactPreview_${Date.now()}.sql`)}
                          title="Baixar para testar no DBeaver/SSMS"
                        >
                          💾 Baixar .SQL
                        </button>
                      </div>
                    </div>
                    
                    <textarea value={response.selectPreview} readOnly className="sql-input suggestion-mode blue-text" />
                    
                    <div className="execution-actions">
                      <button 
                        className={`btn-modern btn-execute-main ${selectStatus === 'success' ? 'success' : 'idle'}`}
                        onClick={handleExecuteSelect}
                        disabled={modalLoading}
                      >
                        {modalLoading ? <><span className="spinner-small"></span> Consultando...</> : selectStatus === 'success' ? 'Impacto Validado' : 'Executar Consulta de Teste'}
                      </button>
                      
                      {modalLoading && (
                        <button className="btn-execute-stop fade-in" onClick={handleCancelQuery}>
                          <StopCircle size={18} /> Parar
                        </button>
                      )}
                    </div>

                    {selectStatus !== 'pending' && (
                      <div className={`query-feedback-card fade-in ${selectStatus === 'success' ? 'success' : 'error'}`}>
                        <div>{modalLoading ? 'Consultando base de dados...' : modalError}</div>
                        {selectStatus === 'success' && modalData.length > 0 && (
                          <button className="btn-outline-green" onClick={() => setModalOpen(true)}>
                            Ver Dados Reais
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* CARD 3: FERRAMENTAS E PDF */}
                <div className="result-card tools-card">
                  <div className="card-header-flex">
                    <div className="checklist-group">
                     <label className={`checklist-label ${hasPassedAI ? 'checked' : 'unchecked'}`}>
                      <input type="checkbox" checked={hasPassedAI} readOnly /> Passou pela IA
                      </label>
                      <label className={`checklist-label ${checklist.tableOk ? 'checked' : 'unchecked'}`}>
                        <input type="checkbox" checked={checklist.tableOk} onChange={(e) => setChecklist({...checklist, tableOk: e.target.checked})} /> Tabela Confirmada
                      </label>
                      <label className={`checklist-label ${checklist.whereOk ? 'checked' : 'unchecked'}`}>
                        <input type="checkbox" checked={checklist.whereOk} onChange={(e) => setChecklist({...checklist, whereOk: e.target.checked})} /> Where Validado
                      </label>
                    </div>

                    <button 
                      className={`btn-report ${(!isFullyValidated || selectStatus !== 'success') ? 'locked' : 'active'}`}
                      disabled={!isFullyValidated || selectStatus !== 'success' || modalLoading}
                      onClick={() => exportarRelatorioPDF(response, { updateFields: parsedData.update, whereFields: parsedData.where, insertFields: parsedData.insert, deleteFields: parsedData.delete }, modalData.length, checklist, i18n.language)}
                    >
                      <Download size={16} /> {(isFullyValidated && selectStatus === 'success') ? 'Gerar PDF de Evidência' : 'PDF Bloqueado'}
                    </button>
                  </div>
                </div>

                {/* TABELAS PARAMETROS */}
              <div className="tables-wrapper" style={{ marginTop: '10px' }}>
                  {Object.keys(parsedData?.delete || {}).length > 0 && (
                    <div style={{ marginBottom: '15px' }}><div style={{ color: '#f43f5e', fontWeight: 'bold', marginBottom: '8px' }}>🗑️ DELETE ALVO:</div><ParamTable data={parsedData.delete} t={t} /></div>
                  )}
                  {Object.keys(parsedData?.update || {}).length > 0 && (
                    <div style={{ marginBottom: '15px' }}><div style={{ color: '#38bdf8', fontWeight: 'bold', marginBottom: '8px' }}>📝 UPDATE SET:</div><ParamTable data={parsedData.update} t={t} /></div>
                  )}
                  {Object.keys(parsedData?.where || {}).length > 0 && (
                    <div style={{ marginBottom: '15px' }}><div style={{ color: '#fbbf24', fontWeight: 'bold', marginBottom: '8px' }}>🎯 FILTROS (WHERE):</div><ParamTable data={parsedData.where} t={t} /></div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}
      </div>

      {showHistory && <QueryHistory history={history} onClose={() => setShowHistory(false)} onSelect={(q) => { copyToClipboard(q); setShowHistory(false); }} />}
      
      {/* MODAL DARK MODE */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📊 Visualização ({modalData.length} registros)</h3>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}>❌</button>
            </div>
            <div className="modal-table-wrapper">
              <table className="modal-table-full">
                <thead>
                  <tr>{Object.keys(modalData[0] || {}).map(key => <th key={key}>{key}</th>)}</tr>
                </thead>
                <tbody>
                  {modalData.slice(0, 100).map((row, i) => ( 
                    <tr key={i}>
                      {Object.values(row).map((val, j) => (
                        <td key={j}>{formatSqlValue(val) === null ? <i style={{ color: '#94a3b8' }}>NULL</i> : formatSqlValue(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <ConnectionModal 
        isOpen={isConnectionModalOpen} 
        onClose={() => setIsConnectionModalOpen(false)} 
        onSave={(dadosConexao) => {
          setServerAtual(dadosConexao.server);
          setDbAtual(dadosConexao.database);
        }}
      />
    </div>
  );
};

export default SqlAnalyzer;