import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';

const cleanConnectionValue = (value) => {
  return String(value || '').trim().replace(/^['"]+|['"]+$/g, '');
};

export const useConnectionModal = (isOpen, onClose, onSave) => {
  const { connection, testConnection } = useApp();

  // Estados do Formulário
  const [server, setServer] = useState('');
  const [database, setDatabase] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  // Estados de Histórico e UI
  const [showServerList, setShowServerList] = useState(false);
  const [showDbList, setShowDbList] = useState(false);
  const [serverHistory, setServerHistory] = useState([]);
  const [dbHistory, setDbHistory] = useState([]);

  // Refs para clique fora
  const serverRef = useRef(null);
  const dbRef = useRef(null);

  // Inicialização ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      const currentServer = cleanConnectionValue(connection.server || localStorage.getItem('saved_server'));
      const currentDb = cleanConnectionValue(connection.database || localStorage.getItem('saved_db'));

      setServer(currentServer);
      setDatabase(currentDb);
      setError('');
      setSuccessMsg('');

      const sHist = JSON.parse(localStorage.getItem('history_servers') || '[]');
      const dHist = JSON.parse(localStorage.getItem('history_dbs') || '[]');
      setServerHistory(sHist);
      setDbHistory(dHist);
    }
  }, [isOpen, connection.server, connection.database]);

  // Handler de clique fora para fechar dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (serverRef.current && !serverRef.current.contains(event.target)) setShowServerList(false);
      if (dbRef.current && !dbRef.current.contains(event.target)) setShowDbList(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveToHistory = useCallback((key, value, currentHistory, setHistoryState) => {
    if (!value) return;
    const filtered = currentHistory.filter(item => item.toUpperCase() !== value.toUpperCase());
    const newHistory = [value, ...filtered].slice(0, 10);
    localStorage.setItem(key, JSON.stringify(newHistory));
    setHistoryState(newHistory);
  }, []);

  const handleTest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsTesting(true);

    try {
      const isSuccess = await testConnection(server, database);
      if (isSuccess) {
        setSuccessMsg('✅ Conexão estabelecida com sucesso!');
        saveToHistory('history_servers', server, serverHistory, setServerHistory);
        saveToHistory('history_dbs', database, dbHistory, setDbHistory);
      } else {
        setError('❌ Falha ao conectar. Verifique os dados.');
      }
    } catch (err) {
      setError(`❌ Erro: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

 const handleSave = (e) => {
    e.preventDefault();
    const cleanedServer = cleanConnectionValue(server);
    const cleanedDatabase = cleanConnectionValue(database);

    if (!cleanedServer || !cleanedDatabase) {
      setError('Preencha os campos corretamente.');
      return;
    }

    saveToHistory('history_servers', cleanedServer, serverHistory, setServerHistory);
    saveToHistory('history_dbs', cleanedDatabase, dbHistory, setDbHistory);
    
    // 🔥 A CORREÇÃO MÁGICA AQUI:
    // 1. Verifica se a função onSave foi passada (evita crash da tela vermelha)
    // 2. Manda como um objeto para o PriceAnalyzer entender certinho
    if (typeof onSave === 'function') {
      onSave({ server: cleanedServer, database: cleanedDatabase });
    }
    
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return {
    state: {
      server,
      database,
      error,
      successMsg,
      isTesting,
      showServerList,
      showDbList,
      serverHistory,
      dbHistory,
    },
    refs: {
      serverRef,
      dbRef,
    },
    actions: {
      setServer,
      setDatabase,
      setShowServerList,
      setShowDbList,
      handleTest,
      handleSave,
    },
  };
};