// 💻 src/components/AutomationManager.js

import React, { useState, useRef, useEffect } from 'react';
import { useAutomation } from '../hooks/useAutomation';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { useApp } from '../context/AppContext';
import { electronAPIService } from '../services/ElectronAPIService';
import { Save, Play, FileCode, Mail, FolderOpen, Settings, UploadCloud, Trash2, Plus, Terminal, Cpu } from 'lucide-react';
import { DEFAULT_OUTPUT_PATH, DEFAULT_EXE_PATH, DEFAULT_FILE_NAME } from '../config';
import './componentsCss/AutomationManager.css'; 

const AutomationManager = () => {
  const { showToast } = useApp();
  const { processTemplate, emailsFound, templateContent, clearTemplate } = useAutomation();
  
  const [filePath, setFilePath] = useLocalStorageState('hypercare_out_path_v2', '');
  const [fileName, setFileName] = useState(''); 
  const [exePath, setExePath] = useLocalStorageState('hypercare_exe_path_v2', '');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [manualEmails, setManualEmails] = useState('');
  
  const [exeLogs, setExeLogs] = useState([]); 
  const terminalEndRef = useRef(null); 

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onExeLog) {
      window.electronAPI.onExeLog((logMessage) => {
        setExeLogs((prev) => [...prev, logMessage]); 
      });
    }
    return () => {
      if (window.electronAPI && window.electronAPI.removeExeLogListeners) {
        window.electronAPI.removeExeLogListeners();
      }
    };
  }, []);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [exeLogs]);

  useEffect(() => {
    if (emailsFound && emailsFound.length > 0) {
      console.log('✅ [DEBUG] Arquivo lido com sucesso!');
      console.log(`📧 [DEBUG] Total de E-mails capturados: ${emailsFound.length}`);
    }
  }, [emailsFound]);

  const handleClearTemplate = () => {
    clearTemplate();
    setManualEmails('');
    setExeLogs([]); 
    setStatusMessage('Template e dados limpos');
    showToast('Tudo limpo com sucesso', 'info');
  };

  const getFinalEmailList = () => {
    const fromFile = emailsFound || [];
    
    const fromManual = manualEmails
      .split(/[,;\n]+/)
      .map(email => email.trim())
      .filter(email => email.length > 0);

    const allEmails = [...new Set([...fromFile, ...fromManual])];
    
    const formattedEmails = allEmails.map(email => {
      if (email.includes(' ')) {
        return `"${email}"`;
      }
      return email;
    });

    const stringFinal = formattedEmails.join(',');
    console.log('🎯 [DEBUG] String Final enviada pro EXE:', stringFinal);

    return stringFinal;
  };

  const handleGenerate = async () => {
    if (!templateContent) {
      showToast('Por favor, carregue um arquivo template primeiro', 'warning');
      return;
    }
    setStatusMessage('Gerando arquivo XML/Excel...');
    setLoading(true);
    
    try {
      const safePath = filePath ? (filePath.endsWith('\\') ? filePath : `${filePath}\\`) : '';
      const fullPath = `${safePath}${fileName}`;
      const response = await electronAPIService.saveAutomationFile(fullPath, templateContent);

      if (response.success) {
        setStatusMessage(`Arquivo salvo com sucesso em ${fullPath}`);
        showToast(`✅ Arquivo salvo!`, 'success');
      } else {
        showToast(`❌ Erro ao salvar: ${response.error}`, 'error');
      }
    } catch (err) {
      showToast(`Erro: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRunExe = async () => {
    if (!exePath.trim()) {
      showToast('Informe o caminho do executável nas configurações.', 'warning');
      return;
    }

    const finalEmails = getFinalEmailList();
    if (!finalEmails) {
      showToast('Nenhum e-mail encontrado para processar.', 'warning');
      return;
    }

    const safePath = filePath ? (filePath.endsWith('\\') ? filePath : `${filePath}\\`) : '';
    const fullPath = `${safePath}${fileName}`;
    
    const comando = `"${exePath}" "${fullPath}" ${finalEmails}`;
    
    setExeLogs([`> Iniciando Automação...`, `> Comando Executado:`, `> ${comando}`]); 
    setStatusMessage('Automação em Andamento...');
    setLoading(true);
    
    try {
      const response = await electronAPIService.runExecutable(comando);
      if (response.success) {
        setStatusMessage('Automação Concluída!');
        showToast('✅ Processo finalizado com sucesso', 'success');
      } else {
        showToast(`❌ Falha: ${response.error}`, 'error');
      }
    } catch (err) {
      setStatusMessage('Erro Crítico na Automação');
      showToast(`Erro: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    // 🔥 PADDING ADICIONADO AQUI PARA DESCOLAR O TÍTULO DO TETO!
    <div className="automation-container fade-in" style={{ position: 'relative', minHeight: '100%', display: 'flex', flexDirection: 'column', padding: '30px 20px' }}>
      
      {loading && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
          <Cpu size={48} color="#38bdf8" className="spin-animation" style={{ marginBottom: '15px' }} />
          <h2 style={{ color: '#f8fafc', margin: 0, textShadow: '0 0 10px rgba(56, 189, 248, 0.8)' }}>Processando Automação</h2>
          <p style={{ color: '#94a3b8' }}>Aguardando o executável finalizar...</p>
        </div>
      )}

      <header className="automation-header">
        <div className="header-title-wrapper">
          <h2>🤖 Automação Hypercare</h2>
          <p className="dashboard-subtitle">Valide a lista de usuários e execute a configuração no sistema.</p>
        </div>
      </header>

      {/* 🔥 GRID AJUSTADO: Alinhamento sempre no topo */}
      <div className="automation-grid" style={{ alignItems: 'stretch' }}>
        
        {/* LADO ESQUERDO: CONFIGURAÇÕES */}
        <section className="automation-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: '25px', height: '100%' }}>
          <h3 className="panel-title" style={{ margin: 0 }}><Settings size={18} />Parâmetros para Execução</h3>
          
          <div className="input-group" style={{ margin: 0 }}>
            <label><FileCode size={14} /> Nome do Arquivo </label>
            <input value={fileName || ''} onChange={(e) => setFileName(e.target.value)} placeholder='Ex: My_report.xlsx'/>
          </div>

          <div className="input-group exe-input-group" style={{ margin: 0 }}>
            <label><Settings size={14}/> Caminho do Executável (.exe ou .bat)</label>
            <input value={exePath || ''} onChange={(e) => setExePath(e.target.value)} placeholder="Ex: C:\Pasta\meu_script.bat" />
          </div>
        </section>

        {/* LADO DIREITO: CONTROLE DE EXECUÇÃO */}
        <section className="automation-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: '15px', height: '100%' }}>
          <h3 className="panel-title" style={{ margin: 0 }}><FileCode size={18} /> Controle de Execução</h3>

          <div className="upload-box" style={{ margin: 0 }}>
            <input 
              type="file" id="upload-template" accept=".html,.htm,.txt,.xml,.xlsx,.csv" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                processTemplate(file);
                setStatusMessage(`Arquivo carregado: ${file.name}`);
              }} 
              hidden 
            />
            <label htmlFor="upload-template" className="btn-upload">
              <UploadCloud size={20} /> Carregar Arquivo
            </label>
            <button type="button" className="btn-clear-template" onClick={handleClearTemplate} disabled={loading || (!templateContent && !manualEmails)}>
              <Trash2 size={16} /> Limpar
            </button>
          </div>

          {statusMessage && (
            <div className="automation-status-banner" style={{ margin: 0 }}>
              <strong>Status:</strong> {statusMessage}
            </div>
          )}

          {emailsFound && emailsFound.length > 0 && (
            <div className="email-list-panel fade-in" style={{ margin: 0 }}>
              <h3 className="email-list-title" style={{ marginBottom: '10px' }}>E-mails lidos do arquivo ({emailsFound.length}):</h3>
              <ul className="email-list" style={{ 
                maxHeight: '180px', overflowY: 'auto', paddingRight: '5px', display: 'flex', flexDirection: 'column', gap: '6px', margin: 0, padding: 0, listStyle: 'none'
              }}>
                {emailsFound.map((email, idx) => (
                  <li key={idx} style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', padding: '8px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#e2e8f0', fontSize: '13px'
                  }}>
                    <Mail size={14} color="#38bdf8" style={{ flexShrink: 0 }} /> 
                    <span style={{ wordBreak: 'break-all' }}>{email}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="input-group" style={{ margin: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Plus size={14} /> Adicionar E-mails Manualmente (Opcional)
            </label>
            <textarea 
              value={manualEmails} onChange={(e) => setManualEmails(e.target.value)}
              placeholder="Cole os e-mails extras aqui (separados por vírgula ou Enter)..." rows={3}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', resize: 'vertical' }}
            />
          </div>

          {/* 🔥 BOTÕES ANCORADOS NO FUNDO (margin-top: auto resolve tudo!) */}
          <div className="action-buttons" style={{ marginTop: 'auto', paddingTop: '15px' }}>
            <button className="btn-modern btn-generate" onClick={handleGenerate} disabled={loading || !templateContent}>
              <Save size={18}/> Salvar Arquivo
            </button>
            <button className="btn-modern btn-execute-exe" onClick={handleRunExe} disabled={loading || (!templateContent && manualEmails.trim() === '')}>
              <Play size={18}/> Executar Automação
            </button>
          </div>
        </section>
      </div>

      {exeLogs.length > 0 && (
        <div className="fade-in" style={{ position: 'relative', zIndex: 100, marginTop: '25px', background: '#000000', borderRadius: '8px', border: '1px solid #334155', overflow: 'hidden', boxShadow: '0 10px 50px rgba(0,0,0,0.8)' }}>
          <div style={{ background: '#1e293b', padding: '8px 15px', fontSize: '12px', color: '#94a3b8', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={14} color="#38bdf8" />
              <strong>TERMINAL DE EXECUÇÃO</strong>
            </div>
            <span style={{ color: loading ? '#facc15' : '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {loading && <span className="live-dot" style={{ background: '#facc15' }}></span>}
              {loading ? 'Rodando Script...' : 'Finalizado'}
            </span>
          </div>

          <div style={{ padding: '15px', height: '200px', overflowY: 'auto', fontFamily: '"Consolas", "Courier New", monospace', fontSize: '13px', lineHeight: '1.5' }}>
            {exeLogs.map((log, index) => {
              let color = '#a5b4fc'; 
              if (log.includes('[ERRO]') || log.toLowerCase().includes('error')) color = '#ef4444';
              if (log.includes('[SISTEMA]') || log.startsWith('>')) color = '#facc15';
              if (log.includes('sucesso') || log.includes('success')) color = '#10b981'; 
              
              return (
                <div key={index} style={{ color: color, marginBottom: '4px', wordBreak: 'break-all' }}>
                  {log}
                </div>
              );
            })}
            {loading && <div className="spin-animation" style={{ color: '#38bdf8', marginTop: '5px' }}>_</div>}
            <div ref={terminalEndRef} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationManager;