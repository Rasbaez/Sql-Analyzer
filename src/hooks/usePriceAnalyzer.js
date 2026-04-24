// 💻 src/hooks/usePriceAnalyzer.js
import { useState } from 'react';
import { useLocalStorageState } from './useLocalStorageState';
import { electronAPIService } from '../services/ElectronAPIService';

export const usePriceAnalyzer = (showToast) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sqlCreds, setSqlCreds] = useLocalStorageState('sql_price_creds', {
    server: '', database: '', user: '', password: ''
  });

  const [filtros, setFiltros] = useState({
    produto: '', filial: '', rota: '', tipoRota: 'B05', uf: '', segmento: '', classificacao: ''
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('BASE'); 
  const [resultados, setResultados] = useState({ base: [], zbdc: [], zbdi: [] });

  const handleInputChange = (e) => setFiltros(prev => ({ ...prev, [e.target.name]: e.target.value.toUpperCase() }));

  const limparFiltros = () => {
    setFiltros({ produto: '', filial: '', rota: '', tipoRota: 'B05', uf: '', segmento: '', classificacao: '' });
    setResultados({ base: [], zbdc: [], zbdi: [] });
  };

  const handleSearch = async () => {
    if (!sqlCreds.server || !sqlCreds.database) {
      showToast('Por favor, configure as credenciais do SQL Server!', 'warning');
      setIsModalOpen(true);
      return;
    }

    setLoading(true);
    const produtosArray = filtros.produto ? filtros.produto.split(',').map(p => p.trim()).filter(p => p) : [];
    const payload = { credenciais: sqlCreds, filtros: { ...filtros, produtos: produtosArray } };

    try {
      const response = await electronAPIService.analyzeSqlPrices(payload);
      if (response.success) {
        setResultados({
          base: response.data.base || [],
          zbdc: response.data.zbdc || [],
          zbdi: response.data.zbdi || []
        });
        showToast('Preços analisados com sucesso!', 'success');
      } else {
        showToast(`Erro SQL: ${response.error}`, 'error');
      }
    } catch (error) {
      showToast(`Falha crítica: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    filtros, resultados, loading, activeTab, isModalOpen, sqlCreds,
    setActiveTab, setIsModalOpen, setSqlCreds, handleInputChange, limparFiltros, handleSearch
  };
};