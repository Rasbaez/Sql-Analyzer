// 💻 src/utils/telemetryHelpers.js

import React from 'react';
import { format } from 'sql-formatter';
import { Play, Square, Settings, Database, MapPin, Cloud, AlertTriangle, Zap } from 'lucide-react';

// ==========================================
// 🎨 RENDERIZADOR DE ÍCONES (Mantido intacto)
// ==========================================
export const renderEventIcon = (type) => {
  if (type === 'Workflow:Start') return <Play size={16} color="#22c55e" />;
  if (type === 'Workflow:End') return <Square size={16} color="#ef4444" />;
  if (type === 'Action:Set') return <Settings size={16} color="#3b82f6" />;
  if (type.includes('Database')) return <Database size={16} color="#f59e0b" />;
  if (type.includes('GPS')) return <MapPin size={16} color="#10b981" />;
  if (type.includes('Sync')) return <Cloud size={16} color="#0ea5e9" />;
  if (type.includes('Crash') || type.includes('Trigger') || type.includes('Warning')) return <AlertTriangle size={16} color="#ef4444" />;
  return <Zap size={16} color="#94a3b8" />;
};

// ==========================================
// 🧹 EMBELEZADOR DE JSON E CÓDIGOS (Mantido intacto)
// ==========================================
export const formatPayload = (rawText) => {
  if (!rawText) return 'Nenhum dado adicional capturado.';
  try {
    const jsonObj = JSON.parse(rawText);
    return JSON.stringify(jsonObj, null, 2);
  } catch (e) {
    return rawText;
  }
};

export const processSQL = (rawSql) => {
  if (!rawSql) return '';
  try {
    const formatted = format(rawSql, { language: 'sql', uppercase: true, indent: '  ' });
    const keywords = /\b(SELECT|FROM|WHERE|AND|OR|LIMIT|ORDER BY|GROUP BY|LEFT JOIN|INNER JOIN|JOIN|IN|ON|CAST|AS|DESC|ASC|UPDATE|DELETE|INSERT INTO|VALUES)\b/gi;
    
    return formatted
      .replace(keywords, '<span class="sql-keyword">$1</span>')
      .replace(/'(.*?)'/g, '<span class="sql-string">\'$1\'</span>')
      .replace(/\b(\d+)\b/g, '<span class="sql-number">$1</span>');
  } catch (err) {
    const keywords = /\b(SELECT|FROM|WHERE|AND|OR|LIMIT|ORDER BY|GROUP BY|LEFT JOIN|INNER JOIN|JOIN|IN|ON|CAST|AS|DESC|ASC|UPDATE|DELETE|INSERT INTO|VALUES)\b/gi;
    return rawSql
      .replace(keywords, '<span class="sql-keyword">$1</span>')
      .replace(/'(.*?)'/g, '<span class="sql-string">\'$1\'</span>')
      .replace(/\b(\d+)\b/g, '<span class="sql-number">$1</span>');
  }
};

export const formatForClipboard = (rawText, isSQL) => {
  if (!rawText) return '';
  if (isSQL) {
    try {
      return format(rawText, { language: 'sql', uppercase: true, indent: '  ' });
    } catch (e) { return rawText; }
  } else {
    try {
      return JSON.stringify(JSON.parse(rawText), null, 2);
    } catch (e) { return rawText; }
  }
};

// ==========================================
// 📋 FUNÇÃO DE CÓPIA BLINDADA (Mantida intacta)
// ==========================================
export const handleCopy = (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(() => alert("Código copiado!"))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
};

const fallbackCopy = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.top = "0"; textArea.style.left = "0"; textArea.style.position = "fixed"; textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus(); textArea.select();
  try {
    const successful = document.execCommand('copy');
    if (successful) alert("Código copiado (Modo de Compatibilidade)!");
    else alert("Erro: O navegador bloqueou a cópia.");
  } catch (err) { alert("Erro ao copiar."); }
  document.body.removeChild(textArea);
};

// ==========================================
// 🤖 EXTRATOR DE MENSAGENS DO APP (NOVO!)
// ==========================================
export const extractAppMessages = (logs) => {
  const msgs = new Set();
  logs.forEach(l => {
    // Pré-check ultrarrápido para não torrar o processador
    if (l.rawDetails.includes('"message"')) { 
      const match = l.rawDetails.match(/"message"\s*:\s*"([^"]+)"/i);
      if (match && match[1]) msgs.add(match[1]);
    }
  });
  return Array.from(msgs).sort();
};

// ==========================================
// 🧠 MOTOR DE AGRUPAMENTO COM "PRESERVAÇÃO DE CONTEXTO" (NOVO!)
// ==========================================
export const groupAndFilterWorkflows = (logs, filters) => {
  const groups = [];
  let currentGroup = null;

  // 1. Cria os Workflows Empacotando os Logs (O(n))
  logs.forEach((log, index) => {
    const flowName = (log.workflowName && log.workflowName !== 'N/A' && log.workflowName !== 'Aviso') 
                     ? log.workflowName 
                     : 'Tarefas de Background / Avulsas';

    if (!currentGroup || currentGroup.name !== flowName) {
      if (currentGroup) groups.push(currentGroup);
      currentGroup = {
        id: `flow-${index}`, name: flowName, startTime: log.timestamp.split(' ')[1],
        events: [], totalDuration: 0, errorCount: 0
      };
    }

    currentGroup.events.push(log);
    if (log.elapsedTime) currentGroup.totalDuration += log.elapsedTime;
    if (log.eventType.includes('Error')) currentGroup.errorCount += 1;
  });
  if (currentGroup) groups.push(currentGroup);

  // 2. Prepara a Regex para a Busca Universal (Ultra-rápido)
  let textRegex = null;
  if (filters.text) {
    const safeText = filters.text.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    textRegex = new RegExp(safeText, 'i'); 
  }
  const wfFilter = filters.workflow ? filters.workflow.toLowerCase() : null;

  // 3. Aplica os Filtros Preservando o Card Inteiro
  return groups.filter(group => {
    // Filtro de Workflow exato (Ex: 'onClick')
    if (wfFilter && !group.name.toLowerCase().includes(wfFilter)) return false;
    
    // Filtros de Categoria (DB / Erros)
    if (filters.type === 'DB' && !group.events.some(e => e.eventType.includes('Database'))) return false;
    if (filters.type === 'ERROR' && group.errorCount === 0) return false;
    
    // Filtros de Arquivo e Tela
    if (filters.form && !group.events.some(e => e.formName.includes(filters.form))) return false;
    if (filters.file && !group.events.some(e => e.fileName.includes(filters.file))) return false;
    
    // Filtro de Mensagens do App (Ex: 'Deseja Salvar?')
    if (filters.message) {
      const hasMsg = group.events.some(e => e.rawDetails.includes(filters.message));
      if (!hasMsg) return false;
    }
    
    // Filtro de DataSource 
    if (filters.dataSource) {
      const hasDs = group.events.some(e => (e.eventType.includes('Database') || e.eventType.includes('Data')) && e.rawDetails.includes(filters.dataSource));
      if (!hasDs) return false;
    }

    // Busca Universal (Texto livre, Regex)
    if (textRegex) {
      const hasText = group.events.some(e => textRegex.test(e.rawDetails) || textRegex.test(e.eventType));
      if (!hasText) return false;
    }

    // Se passou por todas as barreiras acima, o fluxo inteiro é mantido na tela!
    return true;
  });
};