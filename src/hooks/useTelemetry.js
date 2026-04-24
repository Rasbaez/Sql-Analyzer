import { useState, useMemo, useCallback } from 'react';
import { parseLogFiles } from '../utils/logParserService';
import { 
  processSQL, 
  formatPayload, 
  extractAppMessages, 
  groupAndFilterWorkflows 
} from '../utils/telemetryHelpers';

export const useTelemetry = () => {
  // --- ESTADOS DE DADOS ---
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ files: [], forms: [], workflows: [], dataSources: [] });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [selectedLog, setSelectedLog] = useState(null);

  // --- ESTADOS DE UI/FILTROS ---
  const [isDragging, setIsDragging] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const [filters, setFilters] = useState({ 
    file: '', form: '', workflow: '', type: 'ALL', text: '', dataSource: '', message: '' 
  });
  const [activeFilters, setActiveFilters] = useState({ ...filters });

  // --- ESTADOS DO MODAL/INSPECTOR ---
  const [modalView, setModalView] = useState('payload');
  const [modalSearchGeneral, setModalSearchGeneral] = useState('');
  const [modalFilterLines, setModalFilterLines] = useState(false);

  // --- AÇÕES ---
  const toggleCard = (cardId) => 
    setExpandedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));

  const handleClear = useCallback(() => {
    setLogs([]);
    setMeta({ files: [], forms: [], workflows: [], dataSources: [] });
    const empty = { file: '', form: '', workflow: '', type: 'ALL', text: '', dataSource: '', message: '' };
    setFilters(empty);
    setActiveFilters(empty);
    setSelectedLog(null);
    setExpandedCards({});
    setProgress({ current: 0, total: 0 });
  }, []);

  const openModal = (log) => {
    setSelectedLog(log);
    setModalView('payload');
    setModalSearchGeneral(activeFilters.text || activeFilters.message || '');
    setModalFilterLines(!!(activeFilters.text || activeFilters.message));
  };

  const handleProcessFiles = async (inputFiles) => {
    if (!inputFiles || inputFiles.length === 0) return;
    setLoading(true);
    const files = Array.from(inputFiles);
    setProgress({ current: 0, total: files.length });

    try {
      let accumulatedLogs = [];
      let mergedMeta = { files: new Set(), forms: new Set(), workflows: new Set(), dataSources: new Set() };
      const BATCH_SIZE = 5;

      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        const result = await parseLogFiles(batch);
        
        accumulatedLogs = accumulatedLogs.concat(result.logs);
        result.meta.files.forEach(f => mergedMeta.files.add(f));
        result.meta.forms.forEach(f => mergedMeta.forms.add(f));
        result.meta.workflows.forEach(w => mergedMeta.workflows.add(w));
        result.meta.dataSources.forEach(d => mergedMeta.dataSources.add(d));

        setProgress({ current: Math.min(i + BATCH_SIZE, files.length), total: files.length });
        await new Promise(r => setTimeout(r, 50));
      }

      setLogs(accumulatedLogs);
      setMeta({
        files: Array.from(mergedMeta.files).sort(),
        forms: Array.from(mergedMeta.forms).sort(),
        workflows: Array.from(mergedMeta.workflows).sort(),
        dataSources: Array.from(mergedMeta.dataSources).sort()
      });
    } catch (error) {
      console.error("❌ ERRO NO PARSE:", error);
      alert("Erro ao processar logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setLoading(true);
    setTimeout(() => {
      setActiveFilters({ ...filters });
      setExpandedCards({});
      setLoading(false);
    }, 50);
  };

  // --- DADOS COMPUTADOS (MEMOIZADOS) ---
  const extractedMessages = useMemo(() => extractAppMessages(logs), [logs]);
  const groupedWorkflows = useMemo(() => groupAndFilterWorkflows(logs, activeFilters), [logs, activeFilters]);

  const highlightData = useMemo(() => {
    if (!selectedLog) return { html: '', matches: [], totalLines: 0, terms: [] };
    
    const rawText = modalView === 'variables' 
        ? JSON.stringify(selectedLog.variables, null, 2) 
        : (selectedLog.eventType.includes('Database') ? processSQL(selectedLog.rawDetails) : formatPayload(selectedLog.rawDetails));

    const lines = rawText.split('\n');
    const terms = [modalSearchGeneral].filter(t => t.trim().length > 0);
    const matches = [];
    let filteredLines = [];

    lines.forEach((line, index) => {
      let isMatch = false;
      if (terms.length > 0) {
        const lowerLine = line.toLowerCase();
        isMatch = terms.every(term => lowerLine.includes(term.toLowerCase()));
      }
      if (isMatch) matches.push(index);
      if (modalFilterLines && terms.length > 0 && !isMatch) return; 

      let processedLine = line; 
      if (isMatch) {
        terms.forEach(term => {
          const regex = new RegExp(`(${term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
          processedLine = processedLine.replace(regex, '<mark class="code-highlight">$1</mark>');
        });
      }
      filteredLines.push(`<span id="match-line-${index}">${processedLine}</span>`);
    });

    return { html: filteredLines.join('\n'), matches, totalLines: lines.length, terms };
  }, [selectedLog, modalSearchGeneral, modalFilterLines, modalView]);

  return {
    state: { logs, meta, loading, progress, isDragging, selectedLog, filters, activeFilters, modalView, modalSearchGeneral, modalFilterLines, expandedCards },
    computed: { extractedMessages, groupedWorkflows, highlightData },
    actions: {
      setLogs, setFilters, setIsDragging, setSelectedLog, setModalView, setModalSearchGeneral, setModalFilterLines,
      toggleCard, handleClear, openModal, handleProcessFiles, handleApplyFilters
    }
  };
};