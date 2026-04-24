// 🧠 src/hooks/useInvoiceAnalyzer.js

import { useState, useMemo } from 'react';
import { parseNFLogs } from '../utils/nfParserService';

export const useInvoiceAnalyzer = () => {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ invoices: [], orders: [] });
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  
  const [filters, setFilters] = useState({ invoice: '', order: '', product: '', type: 'ALL', text: '' });
  const [activeFilters, setActiveFilters] = useState({ invoice: '', order: '', product: '', type: 'ALL', text: '' });

  const [modalSearchProduct, setModalSearchProduct] = useState('');
  const [modalSearchGeneral, setModalSearchGeneral] = useState('');
  const [modalFilterLines, setModalFilterLines] = useState(false); 
  const [expandedCards, setExpandedCards] = useState({});

  const toggleCard = (cardId) => setExpandedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));

  const openModal = (block) => {
    setSelectedLog(block);
    setModalSearchProduct(filters.product || '');
    setModalSearchGeneral(filters.text || '');
    setModalFilterLines(false); 
  };

  const handleProcessFiles = async (files) => {
    setLoading(true);
    setTimeout(async () => {
      try {
        const result = await parseNFLogs(files); 
        if (result.logs.length === 0) alert("Nenhum bloco de NFe encontrado neste arquivo.");
        setLogs(result.logs); 
        setMeta(result.meta);
      } catch (error) { 
        console.error(error); alert("Erro crítico no parser."); 
      } finally { setLoading(false); }
    }, 200);
  };

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files.length > 0) handleProcessFiles(e.dataTransfer.files); };
  const handleFileSelect = (e) => { if (e.target.files.length > 0) handleProcessFiles(e.target.files); };

  const handleClear = () => {
    setLogs([]); 
    setMeta({ invoices: [], orders: [] });
    const emptyFilters = { invoice: '', order: '', product: '', type: 'ALL', text: '' };
    setFilters(emptyFilters);
    setActiveFilters(emptyFilters);
    setSelectedLog(null); 
    setExpandedCards({});
  };

  const handleApplyFilters = () => {
    setLoading(true);
    setTimeout(() => {
      setActiveFilters({ ...filters }); 
      setExpandedCards({}); 
      setLoading(false);
    }, 100);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleApplyFilters(); };

  // 🧠 MOTOR DE AGRUPAMENTO GLOBAL
  const allGroupedOrders = useMemo(() => {
    
    const invoiceToOrderMap = {};
    logs.forEach(log => {
      if (log.invoiceId !== 'Pendente/Falha' && log.orderId !== 'Pendente/Falha') {
        invoiceToOrderMap[log.invoiceId] = log.orderId;
      }
    });

    const globalCancelledInvoices = new Set();
    logs.forEach(ev => {
      if (ev.isCancelled || ev.status.includes('CANCEL') || ev.status === 'EDITING') {
        if (ev.invoiceId !== 'Pendente/Falha') {
          globalCancelledInvoices.add(String(ev.invoiceId).trim());
        }
      }
    });

    const groups = {};
    logs.forEach(log => {
      let finalOrderId = log.orderId;
      if (finalOrderId === 'Pendente/Falha' && log.invoiceId !== 'Pendente/Falha' && invoiceToOrderMap[log.invoiceId]) {
          finalOrderId = invoiceToOrderMap[log.invoiceId];
      }

      const oId = (finalOrderId && finalOrderId !== 'Pendente/Falha') ? finalOrderId : `Avulso-${log.id}`;
      
      if (!groups[oId]) {
        groups[oId] = {
          id: oId, orderId: finalOrderId, invoiceId: log.invoiceId,
          timestamp: log.timestamp.includes(' ') ? log.timestamp.split(' ')[1] : log.timestamp,
          isB2B: log.isB2B, events: [], successCount: 0, contingencyCount: 0, errorCount: 0, inactiveCount: 0,
          hasCancellation: false,
          hasEdit: false 
        };
      }
      
      if (log.isCancelled) groups[oId].hasCancellation = true;
      if (log.isEdit) groups[oId].hasEdit = true;

      groups[oId].events.push({ ...log, orderId: finalOrderId });
    });

    Object.values(groups).forEach(group => {
      group.events.forEach((ev, idx, arr) => {
        const nextEv = arr[idx + 1];
        const safeInvId = String(ev.invoiceId).trim();

        if ((ev.status === 'SUCCESS' || ev.status === 'CONTINGENCY') && globalCancelledInvoices.has(safeInvId)) {
          ev.status = 'INACTIVE_CANCELLED'; 
        }
        else if (ev.status === 'ERROR' && nextEv && safeInvId !== String(nextEv.invoiceId).trim() && safeInvId !== 'Pendente/Falha') {
          ev.status = 'INACTIVE'; 
        } 

        if (ev.status === 'SUCCESS') group.successCount++;
        else if (ev.status === 'CONTINGENCY') group.contingencyCount++;
        else if (ev.status.includes('INACTIVE') || ev.status === 'EDITING') group.inactiveCount++;
        else if (ev.status.includes('CANCEL')) group.inactiveCount++; 
        else group.errorCount++;
      });

      // 🔥 A MÁGICA DA UX: Linha do tempo das NFEs (Ex: 10689 ➔ 10690)
      const uniqueInvs = [...new Set(group.events.map(e => e.invoiceId).filter(id => id !== 'Pendente/Falha'))];
      if (uniqueInvs.length > 0) {
          group.invoiceId = uniqueInvs.join(' ➔ ');
      }
    });

    return Object.values(groups);
  }, [logs]);

  // 🧠 FILTRO INTELIGENTE
  const groupedOrders = useMemo(() => {
    return allGroupedOrders.filter(group => {
      let matchInvoice = !activeFilters.invoice || group.events.some(ev => ev.invoiceId.includes(activeFilters.invoice));
      let matchOrder = !activeFilters.order || group.orderId.includes(activeFilters.order);
      let matchType = activeFilters.type === 'ALL' ? true : (activeFilters.type === 'B2B' ? group.isB2B : !group.isB2B);
      let matchText = !activeFilters.text || group.events.some(ev => ev.rawDetails.toLowerCase().includes(activeFilters.text.toLowerCase()));
      let matchProduct = !activeFilters.product || group.events.some(ev => ev.rawDetails.includes(activeFilters.product));

      return matchInvoice && matchOrder && matchType && matchText && matchProduct;
    });
  }, [allGroupedOrders, activeFilters]);

  const highlightData = useMemo(() => {
    if (!selectedLog) return { html: '', matches: [], totalLines: 0, terms: [] };
    
    const lines = selectedLog.rawDetails.split('\n');
    const terms = [modalSearchProduct, modalSearchGeneral].filter(t => t.trim().length > 0);
    const totalLines = lines.length;
    const matches = [];
    let filteredLines = [];

    const escapeHTML = (str) => str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));

    lines.forEach((line, index) => {
      let isMatch = false;
      if (terms.length > 0) {
        const lowerLine = line.toLowerCase();
        isMatch = terms.every(term => lowerLine.includes(term.toLowerCase()));
      }

      if (isMatch) matches.push(index); 
      if (modalFilterLines && terms.length > 0 && !isMatch) return; 

      let processedLine = escapeHTML(line);

      if (isMatch) {
        terms.forEach(term => {
          const safeTerm = term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regex = new RegExp(`(${safeTerm})`, 'gi');
          processedLine = processedLine.replace(regex, '<mark style="background-color: #fbbf24; color: #000; padding: 0 2px; border-radius: 3px; font-weight: bold;">$1</mark>');
        });
      }

      filteredLines.push(`<span id="match-line-${index}">${processedLine}</span>`);
    });

    return { html: filteredLines.join('\n'), matches, totalLines, terms };
  }, [selectedLog, modalSearchProduct, modalSearchGeneral, modalFilterLines]);

  return {
    logs, meta, loading, isDragging, selectedLog, setSelectedLog,
    filters, setFilters, modalSearchProduct, setModalSearchProduct,
    modalSearchGeneral, setModalSearchGeneral, modalFilterLines, setModalFilterLines,
    expandedCards, toggleCard, openModal, handleDragOver, handleDragLeave,
    handleDrop, handleFileSelect, handleClear, handleApplyFilters, handleKeyDown,
    groupedOrders, highlightData
  };
};