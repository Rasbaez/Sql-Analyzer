// 💻 src/components/SqlAnalyzer.js

import React, { useState } from 'react';
import './componentsCss/SqlAnalyzer.css';
import { useSqlAnalyzer } from '../hooks/useSqlAnalyzer';
import QueryHistory from './QueryHistory';
import logoMC1 from './assets/logo-mc1.png';
import logoPepsi from './assets/logo-pepsico.png';
import { exportarRelatorioPDF } from '../utils/pdfGenerator';
import { formatSqlValue } from '../utils/data';
import { Database } from 'lucide-react'; 
import ConnectionModal from './ConnectionModal';
import ParamTable from './ParamTable'; 


const SqlAnalyzer = () => {
  // 🔥 Mágica: Puxamos TUDO do nosso Hook!
  const {
    t, i18n, sql, setSql, response, setResponse, loading, stats, history, 
    showHistory, setShowHistory, showCopyPopup, selectStatus, setSelectStatus,
    checklist, setChecklist, parsedData, setParsedData, modalOpen, setModalOpen,
    modalData, modalLoading, modalError, dbAtual, setDbAtual, serverAtual, setServerAtual,
    isConnectionModalOpen, setIsConnectionModalOpen,
    handleExtract, handleCancelQuery, handleExecuteSelect, copyToClipboard, resetChecklist
  } = useSqlAnalyzer();

  const isFullyValidated = checklist.tableOk && checklist.whereOk && checklist.syntaxOk; 
  const flagStyle = { width: '1.5em', height: '1.5em', borderRadius: '50%', objectFit: 'cover' };

  return (
    <div className="analyzer-page">
      {showCopyPopup && (
        <div className="copy-popup fade-in">
          <span>📋 {t('copy_success')}</span>
        </div>
      )}
      
      <div className="analyzer-container fade-in">
        <div className="analyzer-header">
          <div className="logos-wrapper">
            <img src={logoMC1} alt="MC1" className="brand-logo" />
            <div className="header-divider"></div>
            <img src={logoPepsi} alt="PepsiCo" className="brand-logo" />
          </div>

          <div className="header-content-right">
            <h2 className="header-title">{t('header_title')}</h2>
          </div>
        </div>

        <div className="input-section">
          <label className="textarea-titleorign">{t('label_original_query')}</label>
          <textarea 
            value={sql} 
            onChange={(e) => setSql(e.target.value)} 
            className={`sql-input ${stats.hasCritical ? 'input-error' : ''}`} 
            placeholder={t('placeholder_query')} 
          />
        </div>

        <div className="button-container">
          <button 
            className="btn-modern btn-clear" 
            onClick={() => { 
              setSql(''); 
              setResponse(null); 
              setParsedData({ update: {}, where: {}, insert: {}, delete: {} }); 
              resetChecklist(); 
              setSelectStatus('pending'); 
            }}
          >
            {t('btn_clear')}
          </button>

          <button 
            className={`btn-modern btn-validate ${!loading && !sql.trim() ? 'pulse-attention' : ''}`}
            onClick={handleExtract} 
            disabled={loading}
          >
            {loading ? t('btn_analyzing') : t('btn_validate')}
          </button>

          <button className="btn-modern btn-history" onClick={() => setShowHistory(true)}>
            {t('btn_history')} ({history.length})
          </button>
        </div>

        {response && (
          <div className="result-area">
            <div className="alerts-container">
              {stats.isSyntaxOk && (
                <div className="alert-item alert-success fade-in">
                  <span className="alert-icon">✅</span>
                  <span className="alert-message">
                    <strong>{t('status_ok_label')}</strong> {t('status_ok_desc')}
                  </span>
                </div>
              )}
              {response.warnings?.map((msg, i) => (
                <div key={i} className={`alert-item ${msg.includes("🚨") ? 'alert-danger' : 'alert-warning'}`}>
                  <span className="alert-icon">{msg.includes("🚨") ? '🚨' : '⚠️'}</span>
                  <span className="alert-message">{msg}</span>
                </div>
              ))}
            </div>

            {stats.canShowContent && (
              <>
                <div className="suggestion-section fade-in">
                  <label className={`textarea-titleorign ${stats.isSyntaxOk ? 'text-success' : 'text-warning'}`}>
                    {stats.isSyntaxOk ? t('label_formatted_query') : t('label_suggestion_query')}
                  </label>
                  <textarea 
                    value={response.autoFix.fixed} 
                    readOnly 
                    disabled={!isFullyValidated} 
                    className={`sql-input ${stats.isSyntaxOk ? '' : 'suggestion-mode'} ${isFullyValidated ? 'unlocked' : 'locked'}`} 
                  />
                </div>

                {response.selectPreview && (
                  <div className="suggestion-section fade-in">
                    <div className="preview-header">
                      <div className="preview-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        
                        <button className="btn-copy-select" onClick={() => copyToClipboard(response.selectPreview)}>
                          <span>📋</span> {t('btn_copy_select')}
                        </button>
                        
                        {/* 🔥 BOTÃO INTELIGENTE QUE ABRE O MODAL */}
                        <button 
                          onClick={() => setIsConnectionModalOpen(true)}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '6px', color: '#38bdf8', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }} 
                          title="Clique para alterar a conexão"
                        >
                          <Database size={16} />
                          {dbAtual ? dbAtual : "🔌 Configurar Conexão"}
                        </button>

                        <button 
                          className={`btn-execute ${
                            modalLoading ? 'btn-execute-pending' : 
                            selectStatus === 'success' ? 'btn-execute-done' : 
                            selectStatus === 'error' ? 'btn-execute-error' : 
                            'btn-execute-idle btn-pulse-attention'
                          }`} 
                          onClick={handleExecuteSelect}
                          disabled={modalLoading}
                        >
                          {modalLoading ? (
                            <><span className="spinner-small"></span> {t('status_consulting')}...</>
                          ) : (
                            selectStatus === 'success' ? t('status_impact_validated') : t('btn_consult_db')
                          )}
                        </button>

                        {modalLoading && (
                          <button className="btn-execute-stop fade-in" onClick={handleCancelQuery} title="Cancelar execução no banco">
                            <span className="stop-icon">⏹</span> STOP
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <textarea value={response.selectPreview} readOnly className="sql-input suggestion-mode preview-textarea" />

                    {selectStatus !== 'pending' && (
                      <div className={`query-feedback-card ${selectStatus === 'success' ? 'feedback-success' : 'feedback-error'}`}>
                        <span className="error-card-icon">{selectStatus === 'success' ? '✅' : '❌'}</span>
                        <div className="error-card-content">
                          <span className="feedback-card-label">
                            {selectStatus === 'success' ? t('label_result_query') : t('label_error_db')}
                          </span>
                          <span className="feedback-card-msg">
                            {modalLoading ? t('status_consulting_long') : modalError}
                          </span>
                          
                          {selectStatus === 'success' && modalData.length > 0 && (
                            <button onClick={() => setModalOpen(true)} className="btn-view-table-link">
                              {t('btn_view_full_table')}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="checklist-box fade-in">
                  <p className="checklist-title">{t('checklist_title')}</p>
                  <div className="checklist-group">
                    <label className="checklist-label">
                      <input type="checkbox" checked={checklist.syntaxOk} onChange={(e) => setChecklist({...checklist, syntaxOk: e.target.checked})} />
                      {t('check_syntax_rules')}
                    </label>
                    <label className="checklist-label">
                      <input type="checkbox" checked={checklist.tableOk} onChange={(e) => setChecklist({...checklist, tableOk: e.target.checked})} />
                      {t('check_table_correct')}
                    </label>
                    <label className="checklist-label">
                      <input type="checkbox" checked={checklist.whereOk} onChange={(e) => setChecklist({...checklist, whereOk: e.target.checked})} />
                      {t('check_where_filters')}
                    </label>
                  </div>
                  <div className="checklist-actions">
                    <button className="btn-modern btn-copy-query" disabled={!isFullyValidated} onClick={() => copyToClipboard(response.autoFix.fixed)}>
                      {isFullyValidated ? t('btn_copy_validated') : `🔒 ${t('btn_locked_checklist')}`}
                    </button>
                  </div>
                </div>

                <div className="tables-wrapper fade-in">
                  {Object.keys(parsedData.delete).length > 0 && (
                    <div className="table-section">
                      <div className="syntax-ok-header text-danger">🗑️ DELETE:</div>
                      <ParamTable data={parsedData.delete} t={t} />
                    </div>
                  )}
                  {Object.keys(parsedData.insert).length > 0 && (
                    <div className="table-section">
                      <div className="syntax-ok-header">📥 INSERT:</div>
                      <ParamTable data={parsedData.insert} t={t} />
                    </div>
                  )}
                  {Object.keys(parsedData.update).length > 0 && (
                    <div className="table-section">
                      <div className="syntax-ok-header">📝 UPDATE (SET):</div>
                      <ParamTable data={parsedData.update} t={t} />
                    </div>
                  )}
                  {Object.keys(parsedData.where).length > 0 && (
                    <div className="table-section">
                      <div className="syntax-ok-header">🎯 WHERE:</div>
                      <ParamTable data={parsedData.where} t={t} />
                    </div>
                  )}
                </div>
                
                <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    className={`btn-modern btn-report ${(!isFullyValidated || selectStatus !== 'success') ? 'btn-report-locked' : ''}`} 
                    disabled={!isFullyValidated || selectStatus !== 'success' || modalLoading}
                    onClick={() => exportarRelatorioPDF(
                      response, 
                      { updateFields: parsedData.update, whereFields: parsedData.where, insertFields: parsedData.insert, deleteFields: parsedData.delete }, 
                      modalData.length, checklist, i18n.language
                    )}
                  >
                    {(isFullyValidated && selectStatus === 'success') ? t('btn_generate_pdf') : t('btn_pdf_locked')}
                  </button>
                </div>
              </>
            )}
            <div className="dev-signature">{t('dev_by')} <strong>Roberto Baez</strong></div>
          </div>
        )}
      </div>

      {showHistory && (
        <QueryHistory history={history} onClose={() => setShowHistory(false)} onSelect={(q) => { copyToClipboard(q); setShowHistory(false); }} />
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📊 {t('modal_view_title')}</h3>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}>❌</button>
            </div>
            <div className="modal-table-wrapper">
              <table className="modal-table-full">
                <thead className="modal-thead">
                  <tr>{Object.keys(modalData[0] || {}).map(key => <th key={key} className="modal-th">{key}</th>)}</tr>
                </thead>
                <tbody>
                  {modalData.slice(0, 100).map((row, i) => ( 
                    <tr key={i} className="modal-tr">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="modal-td">{formatSqlValue(val) === null ? <i>NULL</i> : formatSqlValue(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {modalData.length > 100 && (
                <div style={{ textAlign: 'center', padding: '15px', color: '#64748b', fontSize: '13px', fontWeight: 'bold', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                  ⚠️ {t('showing_top_100', 'Mostrando apenas os primeiros 100 registros de uma amostra de')} {modalData.length}.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🔥 O MODAL DE CONEXÃO INJETADO NA TELA */}
      <ConnectionModal 
        isOpen={isConnectionModalOpen} 
        onClose={() => setIsConnectionModalOpen(false)} 
        onSave={(server, db) => {
          setServerAtual(server);
          setDbAtual(db);
        }}
      />
    </div>
  );
};


export default SqlAnalyzer;