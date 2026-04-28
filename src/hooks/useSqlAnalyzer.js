// 🧠 src/hooks/useSqlAnalyzer.js
import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalStorageState } from './useLocalStorageState';
import { format } from 'sql-formatter'; 
import { electronAPIService } from '../services/ElectronAPIService';

export const useSqlAnalyzer = () => {
  const { t, i18n } = useTranslation();

  const [sql, setSql] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // 🔥 NOVO ESTADO: Armazena qual IA da cascata respondeu
  const [aiModelUsed, setAiModelUsed] = useState(null); 

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
  
  // Modal de Conexão de Banco
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [dbAtual, setDbAtual] = useLocalStorageState('saved_db', '');
  const [serverAtual, setServerAtual] = useLocalStorageState('saved_server', '');

  const stats = useMemo(() => {
    if (!response) return { isSyntaxOk: false, hasCritical: false, canShowContent: false };
    const hasCrit = !!(response.parserError || response.warnings?.some(msg => msg.includes("🚨")));
    const isOk = !response.parserError && response.isSyntaxOk; // Pega o OK direto do json da IA
    return { 
      isSyntaxOk: isOk, 
      hasCritical: hasCrit, 
      // 🔥 AQUI É O SEGREDO: Se tem query corrigida, MOSTRA a tela. Ignora o hasCrit para não esconder.
      canShowContent: !!response.autoFix?.fixed 
    };
  }, [response]);

  const resetChecklist = () => setChecklist({ tableOk: false, whereOk: false, syntaxOk: false });

  // 🛑 Função para Cancelar
  const handleCancelQuery = () => {
    electronAPIService.cancelSelect(); 
    setModalLoading(false);
    setSelectStatus('error');
    setModalError("🛑 Consulta cancelada pelo usuário.");
  };

// 🧠 src/hooks/useSqlAnalyzer.js (Substitua a função handleExtract)

  // 🔥 CORE: Extração e Análise usando Gemini AI
  const handleExtract = useCallback(async () => {
    if (!sql.trim()) return;
    setLoading(true);
    setResponse(null);
    setAiModelUsed(null); 
    resetChecklist();
    setSelectStatus('pending'); 

    try {
      console.log("🚀 Enviando para a cascata de IA com Timeout de 45s...");

      // ⏱️ TIMEOUT DE PROTEÇÃO (45 SEGUNDOS)
      // Se a IA demorar mais que isso (por instabilidade do Google), o React aborta.
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: Os servidores do Google não responderam a tempo. Tente novamente.")), 45000)
      );

      // Disputa a corrida: Quem responder primeiro (a IA ou o relógio do Timeout) vence.
      const res = await Promise.race([
        window.electronAPI.askGemini(sql),
        timeoutPromise
      ]);
      
      // Recebemos o modelo que foi usado
      if (res.modelUsed) setAiModelUsed(res.modelUsed); 

      // 🛑 SE DEU ERRO DE SISTEMA (Ex: Cota Estourada / 429 / 503)
      if (!res || !res.success) {
        setResponse({ 
          parserError: res?.error || "Erro de processamento", 
          // 🔥 Agora jogamos o erro do sistema pros CARDS VERMELHOS do React!
          criticalErrors: [`🚨 ALERTA DO SISTEMA: ${res?.error || 'Verifique sua conexão.'}`] 
        });
        setLoading(false);
        return;
      }

      let aiData;
      try {
        aiData = JSON.parse(res.data);
      } catch (parseError) {
        setResponse({ 
          parserError: "A IA não retornou um JSON válido.", 
          criticalErrors: ["🚨 ALERTA DE SISTEMA: A resposta da IA veio corrompida. Tente novamente."]
        });
        setLoading(false);
        return;
      }

      let querySugestao = aiData.fixedQuery || sql;
      let previewFormatado = aiData.selectPreview || "";

      try {
        if (querySugestao) querySugestao = format(querySugestao, { language: 'tsql', uppercase: true, indentWidth: 2 });
        if (previewFormatado) previewFormatado = format(previewFormatado, { language: 'tsql', uppercase: true, indentWidth: 2 });
      } catch (e) {}

      setParsedData({
        update: aiData.parsedData?.update || {},
        where: aiData.parsedData?.where || {},
        insert: aiData.parsedData?.insert || {},
        delete: aiData.parsedData?.delete || {}
      });

      const finalResponse = {
        isSyntaxOk: aiData.isSyntaxOk,
        autoFix: { fixed: querySugestao },
        selectPreview: previewFormatado, 
        auditReport: aiData.auditReport || "A IA não forneceu um resumo de alterações.",
        criticalErrors: aiData.criticalErrors || [], // Aqui entram as regras de negócio
        parserError: !aiData.isSyntaxOk ? "A IA detectou violações de regra." : null
      };

      setResponse(finalResponse);

      if (aiData.isSyntaxOk && (!aiData.criticalErrors || aiData.criticalErrors.length === 0)) {
        setHistory(prev => {
          // Salva como um Objeto (com data e a query CORRIGIDA)
          const newEntry = {
            id: Date.now(),
            query: querySugestao, // Salva o que a IA arrumou, não a bagunça do usuário
            timestamp: new Date().toLocaleString('pt-BR')
          };
          
          // Evita salvar a mesma query duas vezes seguidas
          if (prev.length > 0 && prev[0].query === querySugestao) return prev;
          
          return [newEntry, ...prev].slice(0, 50); // Mantém as últimas 50 validações
        });
      }

    } catch (err) { 
        // 🛑 SE CAIR NO TIMEOUT OU PERDER INTERNET, VEM PRA CÁ
        setResponse({ 
          parserError: "Erro na requisição", 
          criticalErrors: [`🚨 FALHA DE COMUNICAÇÃO: ${err.message}`] // Renderiza o Timeout!
        }); 
    } finally { 
      setLoading(false); 
    }
  }, [sql, t, i18n.language, setHistory]);
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setShowCopyPopup(true);
      setTimeout(() => setShowCopyPopup(false), 2500);
    }).catch(err => console.error("Erro ao copiar:", err));
  };

  const downloadSqlFile = (content, filename) => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

// 🔥 VALIDADOR DE IMPACTO (Suporta Select Único e Batch/Lotes)
  const handleExecuteSelect = async () => {
    if (!response?.selectPreview) return;
    setModalLoading(true);
    setModalError(null);
    setModalData([]);

    try {
      const result = await electronAPIService.executeSelect(response.selectPreview, dbAtual, serverAtual);
      
      if (result.success) {
        let totalRows = 0;
        let combinedData = [];

        // 🛡️ Lógica Inteligente para Múltiplos Recordsets (Lote de Selects)
        if (Array.isArray(result.data)) {
          // Verifica se o primeiro elemento também é um array (Isso indica múltiplas tabelas devolvidas)
          if (result.data.length > 0 && Array.isArray(result.data[0])) {
            result.data.forEach(recordset => {
              totalRows += recordset.length;
              // Junta os dados para o Modal (Limitamos a 500 no buffer para não travar a memória do PC)
              if (combinedData.length < 500) {
                combinedData = combinedData.concat(recordset);
              }
            });
          } else {
            // Select Único normal
            totalRows = result.data.length;
            combinedData = result.data;
          }
        }

        setModalData(combinedData);
        setSelectStatus('success'); 
        
        // Exibe o total de todas as queries somadas
        setModalError(`✅ Sucesso! Impacto total validado: ${totalRows} registro(s) afetado(s).`);

        // 🛑 PROTEÇÃO DE INJEÇÃO DO TOP (Apenas para query única!)
        // Se for um lote de queries (;), nós bloqueamos o TOP para não corromper o script.
        const isBatch = response.autoFix?.fixed && response.autoFix.fixed.split(';').filter(q => q.trim()).length > 1;

        if (totalRows > 0 && response.autoFix?.fixed && !isBatch) {
          let queryComTop = response.autoFix.fixed;
          
          if (/^UPDATE\b/i.test(queryComTop) && !/UPDATE\s+TOP\s*\(/i.test(queryComTop)) {
              queryComTop = queryComTop.replace(/^UPDATE\b/i, `UPDATE TOP (${totalRows})`);
          }
          else if (/^DELETE\b/i.test(queryComTop) && !/DELETE\s+TOP\s*\(/i.test(queryComTop)) {
              queryComTop = queryComTop.replace(/^DELETE\b/i, `DELETE TOP (${totalRows})`);
          }
          
          setResponse(prev => ({ ...prev, autoFix: { ...prev.autoFix, fixed: queryComTop } }));
        }

      } else {
        setModalError(result.error);
        setSelectStatus('error'); 
      }
    } catch (err) {
      setModalError("Falha na comunicação com o banco de dados.");
      setSelectStatus('error'); 
    } finally { 
      setModalLoading(false); 
    }
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
    handleExtract, handleCancelQuery, handleExecuteSelect, copyToClipboard, resetChecklist, downloadSqlFile,
    aiModelUsed // 🔥 Exportando o modelo para o React!
  };
};