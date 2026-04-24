// 💻 src/hooks/useMongoInvoice.js
import { useState, useCallback } from 'react';
import { validateInvoiceData } from '../utils/helpers/mongoHelpers';

export const useMongoInvoice = (mongoConfig, targetCollection) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [missingInvoices, setMissingInvoices] = useState([]);
  const [isCancelled, setIsCancelled] = useState(false);

  const handleSearch = useCallback(async (inputs) => {
    if (!mongoConfig.server) return { error: 'NO_CONFIG' };

    setLoading(true);
    setIsCancelled(false);
    setMissingInvoices([]);
    setResults([]);

    const separator = /[\s,]+/;
    const cIDInvoice = inputs.invoices.split(separator).filter(Boolean);
    const cIDBranchInvoice = inputs.branches.split(separator).filter(Boolean);
    
    // 🔥 Regra da Série: se tiver 2 caracteres, preenche com 0 na frente
    const cSerie = inputs.series.split(separator).filter(Boolean).map(s => 
      s.length === 2 ? `0${s}` : s
    );

    if (cIDInvoice.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const res = await window.electronAPI.getMongoInvoices(
        mongoConfig, 
        { cSerie, cIDBranchInvoice, cIDInvoice }, 
        targetCollection
      );
      
      // Se o usuário clicou em Stop enquanto a query rodava
      if (isCancelled) return;

      if (res.success) {
        const faltantes = cIDInvoice.filter(id => !res.data.some(nf => nf.cIDInvoice === id));
        setMissingInvoices(faltantes);
        const processed = res.data.map(validateInvoiceData);
        setResults(processed);
      } else {
        return { error: res.error };
      }
    } catch (err) {
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  }, [mongoConfig, targetCollection, isCancelled]);

  const handleStop = () => {
    setLoading(false);
    setIsCancelled(true);
    // Aqui avisamos o usuário que parou
    setResults([]); 
  };

  return {
    loading,
    results,
    missingInvoices,
    handleSearch,
    handleStop
  };
};