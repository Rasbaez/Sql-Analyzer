// 🧠 src/hooks/useSqlAnalyzer.js

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalStorageState } from './useLocalStorageState';
import { processSqlData } from '../utils/sqlProcessor';
import { validarConteudoNegocio } from '../utils/schemaRules';
import { format } from 'sql-formatter'; 

export const useSqlAnalyzer = () => {
  const { t, i18n } = useTranslation();

  const [sql, setSql] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // Histórico
  const [history, setHistory] = useLocalStorageState('mc1_sql_analyzer_history', []);
  const [showHistory, setShowHistory] = useState(false);
  const [showCopyPopup, setShowCopyPopup] = useState(false);
  
  const [selectStatus, setSelectStatus] = useState('pending');
  const [checklist, setChecklist] = useState({ tableOk: false, whereOk: false, syntaxOk: false });
  const [parsedData, setParsedData] = useState({ update: {}, where: {}, insert: {}, delete: {} });

  // Modal de Resultados SQL
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false); 
  const [modalError, setModalError] = useState(null);
  
  // 🔥 Modal de Conexão de Banco
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [dbAtual, setDbAtual] = useLocalStorageState('saved_db', '');
  const [serverAtual, setServerAtual] = useLocalStorageState('saved_server', '');

  const stats = useMemo(() => {
    if (!response) return { isSyntaxOk: false, hasCritical: false, canShowContent: false };
    const hasCrit = !!(response.parserError || response.warnings?.some(msg => msg.includes("🚨")));
    const isOk = !response.parserError && (!response.warnings || response.warnings.length === 0);
    return { isSyntaxOk: isOk, hasCritical: hasCrit, canShowContent: !hasCrit };
  }, [response]);

  const resetChecklist = () => setChecklist({ tableOk: false, whereOk: false, syntaxOk: false });

  // 🛑 Função para Cancelar
  const handleCancelQuery = () => {
    window.electronAPI.cancelSelect(); 
    setModalLoading(false);
    setSelectStatus('error');
    setModalError("🛑 Consulta cancelada pelo usuário.");
  };

  const handleExtract = useCallback(async () => {
    if (!sql.trim()) return;
    setLoading(true);
    setResponse(null);
    resetChecklist();
    setSelectStatus('pending'); 

    try {
      const res = await window.electronAPI.extractParams(sql);
      
      if (!res || res.parserError) {
        setResponse({ 
          parserError: res?.parserError || t('error_process_sql'), 
          warnings: [`🚨 ${t('alert_critical_syntax')}`] 
        });
        return;
      }

      const businessWarnings = validarConteudoNegocio(res.params, sql);
      let querySugestao = res.autoFix?.fixed || sql;

      try {
        querySugestao = format(querySugestao, { language: 'tsql', uppercase: true, indentWidth: 2 });
      } catch (e) { console.warn("⚠️ Sintaxe impediu sql-formatter."); }

      let previewFormatado = res.selectPreview;
      if (previewFormatado) {
        try {
          previewFormatado = format(previewFormatado, { language: 'tsql', uppercase: true, indentWidth: 2 });
        } catch (e) {}
      }

      const processed = processSqlData(querySugestao, res.params);
      setParsedData({
        update: processed.updateFields || {},
        where: processed.whereFields || {},
        insert: processed.insertFields || {},
        delete: processed.deleteFields || {}
      });

      const finalResponse = {
        ...res,
        autoFix: { ...res.autoFix, fixed: querySugestao },
        selectPreview: previewFormatado, 
        warnings: [...(res.warnings || []), ...businessWarnings, ...(processed.customWarnings || [])]
      };

      setResponse(finalResponse);

      if (!finalResponse.warnings.some(m => m.includes("🚨"))) {
        setHistory(prev => {
          const matchTabela = querySugestao.match(/(?:UPDATE|DELETE FROM|INSERT INTO|FROM)\s+([a-zA-Z0-9_.\[\]]+)/i);
          const tabelaNome = matchTabela ? matchTabela[1] : t('hidden_table');
          const tipo = querySugestao.trim().split(' ')[0].toUpperCase();

          const filtered = prev.filter(h => h.query.trim() !== querySugestao.trim());
          
          const newEntry = { 
            query: querySugestao, 
            tabela: tabelaNome,
            tipo: tipo,
            time: new Date().toLocaleString(
              i18n.language === 'pt' ? 'pt-BR' : 
              i18n.language === 'es' ? 'es-ES' : 'en-US'
            ) 
          };

          return [newEntry, ...filtered].slice(0, 500); 
        });
      }
    } catch (err) { 
        console.error(err);
        setResponse({ parserError: t('error_bridge_system') }); 
    } finally { setLoading(false); }
  }, [sql, t, i18n.language, setHistory]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setShowCopyPopup(true);
      setTimeout(() => setShowCopyPopup(false), 2500);
    }).catch(err => console.error("Erro ao copiar:", err));
  };

  const handleExecuteSelect = async () => {
    if (!response?.selectPreview) return;
    setModalLoading(true);
    setModalError(null);
    setModalData([]);

    try {
      // 🔥 MUDANÇA ARQUITETURAL AQUI: Enviando a conexão dinâmica global!
      const result = await window.electronAPI.executeSelect(response.selectPreview, dbAtual, serverAtual);
      
      if (result.success) {
        setModalData(result.data);
        setSelectStatus('success'); 
        setModalError(`${t('db_success_msg')} ${result.data.length} ${t('db_records_found')}`);

        try {
          const resRevalidado = await window.electronAPI.extractParams(sql, result.data.length);
          if (resRevalidado && !resRevalidado.parserError) {
            let queryComTop = resRevalidado.autoFix?.fixed || sql;
            try {
              queryComTop = format(queryComTop, { language: 'tsql', uppercase: true, indentWidth: 2 });
            } catch (e) {}
            
            const count = result.data.length;
            if (/^UPDATE\b/i.test(queryComTop) && !/UPDATE\s+TOP\s*\(/i.test(queryComTop)) {
                queryComTop = queryComTop.replace(/^UPDATE\b/i, `UPDATE TOP (${count})`);
            }
            else if (/^DELETE\b/i.test(queryComTop) && !/DELETE\s+TOP\s*\(/i.test(queryComTop)) {
                queryComTop = queryComTop.replace(/^DELETE\b/i, `DELETE TOP (${count})`);
            }
            setResponse(prev => ({ ...prev, autoFix: { ...prev.autoFix, fixed: queryComTop } }));
          }
        } catch (revalErr) { console.error(revalErr); }
      } else {
        setModalError(result.error);
        setSelectStatus('error'); 
      }
    } catch (err) {
      setModalError(t('db_error_comm'));
      setSelectStatus('error'); 
    } finally { setModalLoading(false); }
  };

  return {
    t, i18n,
    sql, setSql,
    response, setResponse,
    loading, stats,
    history, setHistory,
    showHistory, setShowHistory,
    showCopyPopup,
    selectStatus, setSelectStatus,
    checklist, setChecklist,
    parsedData, setParsedData,
    modalOpen, setModalOpen,
    modalData, modalLoading, modalError,
    dbAtual, setDbAtual,
    serverAtual, setServerAtual,
    isConnectionModalOpen, setIsConnectionModalOpen,
    handleExtract, handleCancelQuery, handleExecuteSelect, copyToClipboard, resetChecklist
  };
};