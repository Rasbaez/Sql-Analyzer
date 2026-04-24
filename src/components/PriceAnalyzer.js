// 💻 src/components/PriceAnalyzer.js

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { electronAPIService } from '../services/ElectronAPIService';
import { Search, DollarSign, Percent, Tag, Box, MapPin, FileDigit, Trash2, Loader2, Database } from 'lucide-react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import ConnectionModal from './ConnectionModal'; 
import './componentsCss/PriceAnalyzer.css'; 

const PriceAnalyzer = () => {
  const { showToast, connection } = useApp();
  const { t } = useTranslation();
  
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

  const renderDynamicTable = (dados) => {
    if (!dados || dados.length === 0) {
      return <div style={{ textAlign: 'center', marginTop: '50px', color: '#64748b' }}>Nenhum registro retornado.</div>;
    }

    const headers = Object.keys(dados[0]);

    return (
      <div className="dynamic-table-wrapper">
        <table className="dynamic-table">
          <thead>
            <tr>
              {headers.map((coluna, index) => (
                <th key={index}>{coluna}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dados.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map((coluna, colIndex) => {
                  const valor = row[coluna];
                  let valorFormatado = valor !== null && valor !== undefined ? String(valor) : 'NULL';
                  if (valor instanceof Date) valorFormatado = valor.toLocaleString();
                  return (
                    <td key={colIndex} style={{ color: valor === null ? '#ef4444' : '#e2e8f0' }}>
                      {valorFormatado}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    // 🔥 AQUI ESTAVA O ERRO! Devolvi a classe "automation-container" pra puxar o fundo escuro do seu App!
    <div className="automation-container price-analyzer-container fade-in">
      
      {isModalOpen && (
        <ConnectionModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          onSave={(credenciais) => {
            if (credenciais) setSqlCreds(credenciais);
            setIsModalOpen(false);
            showToast('Credenciais do SQL atualizadas com sucesso!', 'success');
          }}
        />
      )}

      {/* HEADER PRINCIPAL */}
      <header className="price-analyzer-header">
        <div>
          <h2 style={{ margin: 0, color: '#e2e8f0' }}>💰 Analisador de Preços (SQL)</h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>Consulte o Preço Base (I007) e Condições ZBDC/ZBDI via SQL.</p>
        </div>
        <button className="btn-modern" onClick={() => setIsModalOpen(true)} style={{ background: '#1e293b', border: '1px solid #38bdf8', color: '#38bdf8' }}>
          <Database size={14}/> 
           {connection?.database ? ` ${connection.database}` : ` ${t('route_configure_connection', 'Configurar Banco')}`}
        </button>
      </header>    

      {/* FILTROS PANEL - 🔥 Devolvi o glass-card aqui */}
      <section className="price-filters-panel glass-card">
        <div className="price-filters-header">
          <h3 style={{ margin: 0, fontSize: '14px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Search size={16} /> Parâmetros de Busca
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-modern" onClick={limparFiltros} disabled={loading} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '6px 12px', fontSize: '12px' }}>
              <Trash2 size={14}/> Limpar
            </button>
            <button className="btn-modern btn-generate" onClick={handleSearch} disabled={loading} style={{ padding: '6px 15px', fontSize: '12px' }}>
              {loading ? <Loader2 size={14} className="spin-animation" /> : <Search size={14}/>} Buscar Preços
            </button>
          </div>
        </div>
        
        <div className="price-filters-grid">
          <div className="input-group" style={{ margin: 0, gridColumn: 'span 2' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8' }}>Produto(s) (Deixe branco para todos)</label>
            <input name="produto" value={filtros.produto} onChange={handleInputChange} placeholder="Ex: 300061662, 300061624" />
          </div>
          <div className="input-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: '#94a3b8' }}>Filial</label>
            <input name="filial" value={filtros.filial} onChange={handleInputChange} placeholder="7892" />
          </div>
          <div className="input-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: '#94a3b8' }}>Rota</label>
            <input name="rota" value={filtros.rota} onChange={handleInputChange} placeholder="BR440" />
          </div>
          <div className="input-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: '#94a3b8' }}>Tipo Rota</label>
            <input name="tipoRota" value={filtros.tipoRota} onChange={handleInputChange} placeholder="B05" />
          </div>
          <div className="input-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: '#94a3b8' }}>UF</label>
            <input name="uf" value={filtros.uf} onChange={handleInputChange} placeholder="PR" />
          </div>
          <div className="input-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: '#94a3b8' }}>Segm.</label>
            <input name="segmento" value={filtros.segmento} onChange={handleInputChange} placeholder="S06" />
          </div>
          <div className="input-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: '#94a3b8' }}>Classif.</label>
            <input name="classificacao" value={filtros.classificacao} onChange={handleInputChange} placeholder="15" />
          </div>
        </div>
      </section>

      {/* RESULTS PANEL - 🔥 Devolvi o glass-card aqui */}
      <section className="price-results-panel glass-card">
        <div className="price-tabs-header">
          <button onClick={() => setActiveTab('BASE')} className="price-tab-btn" style={getDynamicTabStyle(activeTab === 'BASE', '#38bdf8')}>
            <DollarSign size={16}/> Base I007 ({resultados.base.length})
          </button>
          <button onClick={() => setActiveTab('ZBDC')} className="price-tab-btn" style={getDynamicTabStyle(activeTab === 'ZBDC', '#10b981')}>
            <Tag size={16}/> ZBDC ({resultados.zbdc.length})
          </button>
          <button onClick={() => setActiveTab('ZBDI')} className="price-tab-btn" style={getDynamicTabStyle(activeTab === 'ZBDI', '#f59e0b')}>
            <Percent size={16}/> ZBDI ({resultados.zbdi.length})
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#38bdf8' }}>
            <Loader2 size={32} className="spin-animation" style={{ marginBottom: '10px' }} />
            <p>Processando Tabelas...</p>
          </div>
        ) : (
          renderDynamicTable(activeTab === 'BASE' ? resultados.base : (activeTab === 'ZBDC' ? resultados.zbdc : resultados.zbdi))
        )}
      </section>
    </div>
  );
};

const getDynamicTabStyle = (isActive, color) => ({
  border: isActive ? `1px solid ${color}` : '1px solid transparent', 
  background: isActive ? `${color}15` : 'rgba(255, 255, 255, 0.05)', 
  color: isActive ? color : '#94a3b8', 
  fontWeight: isActive ? 'bold' : 'normal'
});

export default PriceAnalyzer;