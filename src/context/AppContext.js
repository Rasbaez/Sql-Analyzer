// 🎯 src/context/AppContext.js - Estado Global da Aplicação
import React, { createContext, useContext, useState, useEffect } from 'react';
import { electronAPIService } from '../services/ElectronAPIService'; // 🔥 Injetando o Garçom!

// Contexto principal
const AppContext = createContext();

// Hook para usar o contexto
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
};


// Função de limpeza
const sanitize = (val) => {
  if (!val || val === '[object Object]' || val === 'undefined') return '';
  return String(val).trim().replace(/^['"]+|['"]+$/g, '');
};



// Provider do contexto
export const AppProvider = ({ children }) => {
  // 🔥 Estado de Conexão
  const [connection, setConnection] = useState({
    server: localStorage.getItem('saved_server') || '',
    database: localStorage.getItem('saved_db') || 'BO_WTM_PEPSICO_BR',
    isConnected: false,
    lastTest: null
  });

  // 🔥 Estado da UI
  const [ui, setUi] = useState({
    // 👇 Puxa a última tela salva ou vai pro automation por padrão
    currentMenu: localStorage.getItem('last_menu') || 'automation', 
    sidebarCollapsed: false,
    theme: 'dark'
  });

  // 🔥 Estado de Toast
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'info' // 'success', 'error', 'warning', 'info'
  });

  // 🔥 Estado de Automação
  const [automation, setAutomation] = useState({
    isRunning: false,
    currentStep: null,
    progress: 0,
    results: null
  });

  // 🔥 Efeitos para persistência
  useEffect(() => {
    localStorage.setItem('saved_server', connection.server);
    localStorage.setItem('saved_db', connection.database);
  }, [connection.server, connection.database]);


  // 🔥 Funções de Conexão
  const testConnection = async (serverToTest = null, dbToTest = null) => {
    // Permite testar os dados digitados no Modal ANTES de salvar, 
    // ou pega do estado global se não passar nada.
    const server = serverToTest || connection.server;
    const database = dbToTest || connection.database;

    if (!server || !database) {
      showToast('⚠️ Preencha o servidor e o banco de dados antes de testar!', 'warning');
      return false;
    }

    showToast('⏳ Testando conexão com o servidor...', 'info');

    try {
      // 🚀 Dispara a chamada real pro Electron (Back-end)
      const result = await electronAPIService.testConnection(server, database);
      
      // Verifica a resposta (ajuste o "result.connected" dependendo de como seu back-end retorna)
      if (result && (result.connected !== false && result.success !== false)) {
        setConnection(prev => ({ ...prev, isConnected: true, lastTest: new Date() }));
        showToast(`✅ Conectado com sucesso em ${database}!`, 'success');
        return true;
      } else {
        throw new Error(result.error || 'Falha ao conectar com as credenciais informadas.');
      }
    } catch (error) {
      console.error("🚨 [AppContext] Erro no teste de conexão:", error);
      setConnection(prev => ({ ...prev, isConnected: false, lastTest: new Date() }));
      showToast(`❌ Erro na conexão: ${error.message}`, 'error');
      return false;
    }
  };

  const updateConnection = (server, database) => {
    // Se o que vier for um objeto (erro comum de Select), tenta pegar o valor dentro dele
    const s = typeof server === 'string' ? server : (server?.value || server?.server || '');
    const d = typeof database === 'string' ? database : (database?.value || database?.database || '');

    setConnection(prev => ({
      ...prev,
      server: sanitize(s) || prev.server,
      database: sanitize(d) || prev.database
    }));
  };

  // 🔥 Funções da UI
  const switchMenu = (menu) => {
    localStorage.setItem('last_menu', menu); // 👇 Salva a tela no HD para não perder no F5!
    setUi(prev => ({ ...prev, currentMenu: menu }));
  };

  const toggleSidebar = () => {
    setUi(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  };

  // 🔥 Funções de Toast
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    // Auto-hide após 5 segundos
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  // 🔥 Funções de Automação
  const startAutomation = () => {
    setAutomation(prev => ({ ...prev, isRunning: true, progress: 0 }));
  };

  const stopAutomation = () => {
    setAutomation(prev => ({ ...prev, isRunning: false, currentStep: null, progress: 0 }));
  };

  const updateAutomationProgress = (step, progress) => {
    setAutomation(prev => ({ ...prev, currentStep: step, progress }));
  };

  const setAutomationResults = (results) => {
    setAutomation(prev => ({ ...prev, results, isRunning: false }));
  };

  // 🔥 Valor do contexto
  const value = {
    // Estado
    connection,
    ui,
    activeMenu: ui.currentMenu,
    sidebarCollapsed: ui.sidebarCollapsed,
    toast,
    automation,

    // Funções de Conexão
    testConnection,
    updateConnection,

    // Funções da UI
    switchMenu,
    toggleSidebar,

    // Funções de Toast
    showToast,
    hideToast,

    // Funções de Automação
    startAutomation,
    stopAutomation,
    updateAutomationProgress,
    setAutomationResults
  };

  useEffect(() => {
    // Só logar se estiver em ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.groupCollapsed('%c📦 [AppContext Update]', 'color: #38bdf8; font-weight: bold;');
      console.log('%cEstado Anterior:', 'color: #94a3b8; font-weight: bold;', {
        connection,
        ui,
        toast,
        automation
      });
      // Aqui o log mostra o valor atual após o re-render
      console.groupEnd();
    }
  }, [connection, ui, toast, automation]); // 👈 Monitora todas as frentes

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};