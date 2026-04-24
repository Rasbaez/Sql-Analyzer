// 🧠 src/hooks/useRouteData.js - O Motor Lógico (Agora com Mongo Integrado!)
import { useState, useRef } from 'react';
import { getCompanyId } from '../utils/data/routeUtils';
import { validateInvoiceData } from '../utils/helpers/mongoHelpers'; 
import { validateEodData } from '../utils/helpers/eodHelpers'; 

import { 
  getMasterQuery, getTasksQuery, getInvoiceListQuery,
  getInventoryQuery, getPvvOrdersQuery, getCurrentVisitQuery, getManifestQuery,
  getLiquidateQuery 
} from '../components/routeQueries';

import { electronAPIService } from '../services/ElectronAPIService';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';

const QUERY_TIMEOUT_MS = 30000;

const cleanConnectionValue = (value) => {
  const cleaned = String(value || '').trim().replace(/^['"]+|['"]+$/g, '');
  // 🔥 Se ele pescar um '[object Object]' do localStorage, ele devolve vazio!
  if (cleaned === '[object Object]') return '';
  return cleaned;
};

export const useRouteData = () => {
  const { connection, showToast, updateConnection } = useApp();
  const { t } = useTranslation();

  // Estados do SQL
  const [rota, setRota] = useState('');
  const [selectedServer, setSelectedServer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [queryStatus, setQueryStatus] = useState('pending');
  const timeoutRef = useRef(null);
  const isQueryCancelled = useRef(false);


  
  // 🔥 Estados do MUID (Nota Fiscal)
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [selectedMuidData, setSelectedMuidData] = useState(null);
  const [isMuidLoading, setIsMuidLoading] = useState(false);

  // 🔥 Estados do EOD (Fechamento)
  const [selectedEodData, setSelectedEodData] = useState(null);
  const [isEodLoading, setIsEodLoading] = useState(false);

  const [historico, setHistorico] = useState(() => {
    const salvo = localStorage.getItem('historico_rotas');
    return salvo ? JSON.parse(salvo) : [];
  });

  const handleSaveConnection = (server, db) => {
    updateConnection(server, db);
    setIsConnectionModalOpen(false);
  };

  // 🔥 LÓGICA DO EOD
  const handleVerEod = async (liquidate, company) => {
    setIsEodLoading(true);


    const mongoConfig = {
      server: localStorage.getItem('mongo_server'),
      database: localStorage.getItem('mongo_db') || 'MDB_PEPSICO_BR',
      user: localStorage.getItem('mongo_user'),
      password: localStorage.getItem('mongo_pass')


      
    };

    try {
      // 🔥 Trocar getMongoInvoices por getMongoEods
      const res = await window.electronAPI.getMongoEods(
        mongoConfig, 
        { cIDLiquidate: [liquidate.toString()], cIDCompany: company }, 
        'EndofDayExport'
      );

      if (res.success && res.data.length > 0) {
        // 🔥 A MÁGICA AQUI: Mapeando todo o array para validar múltiplos EODs
        const eodsValidados = res.data.map(eod => validateEodData(eod));
        setSelectedEodData(eodsValidados); 
      } else {
        alert(`EOD ${liquidate} não localizado no MongoDB.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEodLoading(false);
    }
  };

  // 🔥 LÓGICA DA NOTA FISCAL
  const handleVerMuid = async (invoice, serie, cdv) => {
    setIsMuidLoading(true);
    
    const mongoConfig = {
      server: localStorage.getItem('mongo_server'),
      database: localStorage.getItem('mongo_db') || 'MDB_PEPSICO_BR',
      user: localStorage.getItem('mongo_user'),
      password: localStorage.getItem('mongo_pass')
    };

    if (!mongoConfig.server) {
      alert("Configure o MongoDB no menu 'Mongo Invoices' primeiro.");
      setIsMuidLoading(false);
      return;
    }

    try {
      const serieStr = serie.toString();
      const serieFormatada = serieStr.length === 2 ? `0${serieStr}` : serieStr;

      const res = await window.electronAPI.getMongoInvoices(
        mongoConfig, 
        { 
          cSerie: [serieFormatada], 
          cIDBranchInvoice: [cdv.toString()], 
          cIDInvoice: [invoice.toString()] 
        }, 
        'InvoiceSapExport'
      );
      
      if (res.success && res.data.length > 0) {
        setSelectedMuidData(validateInvoiceData(res.data[0]));
      } else {
        alert(`Nota ${invoice} não localizada no MongoDB.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsMuidLoading(false);
    }
  };

  const handleCancelRoute = () => {
    isQueryCancelled.current = true;
    electronAPIService.cancelSelect();
    setLoading(false);
    setQueryStatus('cancelled');
    setErrorMessage('🛑 Consulta cancelada pelo usuário.');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const clearTimeoutRef = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleBuscarRota = async () => {
    if (!rota.trim()) return alert("Digite o código da Rota!");

    let savedServer = cleanConnectionValue(connection.server);
    let savedDb = cleanConnectionValue(connection.database);

    if (!savedServer) savedServer = cleanConnectionValue(localStorage.getItem('saved_server'));
    if (!savedDb) savedDb = cleanConnectionValue(localStorage.getItem('saved_db')) || 'BO_WTM_PEPSICO_BR';

    if (!savedServer) {
      setErrorMessage('Servidor não configurado. Acesse a tela de conexão e salve o servidor.');
      setLoading(false);
      return;
    }

    const novaRota = rota.trim().toUpperCase();
    const historicoAtual = [...historico];
    const index = historicoAtual.indexOf(novaRota);
    if (index > -1) historicoAtual.splice(index, 1);
    
    const novoHistorico = [novaRota, ...historicoAtual].slice(0, 10);
    setHistorico(novoHistorico);
    localStorage.setItem('historico_rotas', JSON.stringify(novoHistorico));

    setLoading(true);
    setQueryStatus('pending');
    setSearchAttempted(true);
    setRouteData(null); 
    setErrorMessage(null);
    isQueryCancelled.current = false;
    clearTimeoutRef();
    
    timeoutRef.current = setTimeout(() => {
      isQueryCancelled.current = true;
      electronAPIService.cancelSelect();
      setLoading(false);
      setQueryStatus('error');
      setErrorMessage('⏱️ Tempo limite excedido. A consulta demorou mais de 30 segundos.');
    }, QUERY_TIMEOUT_MS);
    
    const company = getCompanyId(savedDb);
    const rotaBusca = novaRota;

    try {
      const queryMaster = getMasterQuery(rotaBusca, company);
      const resMaster = await electronAPIService.executeSelect(queryMaster, savedDb, savedServer);

      if (isQueryCancelled.current) {
        clearTimeoutRef();
        return;
      }

      if (resMaster.success && resMaster.data.length > 0) {
        const fullData = resMaster.data[0];
        const rotaIsPVV = fullData.xRouteType === 'B07';
        if (!fullData.mc1enabled || String(fullData.mc1enabled) !== '1') {
           setRouteData(null);
           setErrorMessage(`Acesso Bloqueado: Não há usuários operacionais ativos (mc1enabled = 1) vinculados a esta rota no momento.`);
           setQueryStatus('error');
           clearTimeoutRef();
           setLoading(false);
           return; 
        }
        
        try {
          const queryTasks = getTasksQuery(rotaBusca, company);
          const resTasks = await electronAPIService.executeSelect(queryTasks, savedDb, savedServer);
          const tarefas = resTasks.success ? resTasks.data : [];

          let temVisita = false;
          let visitasFinalizadas = false;
          let statusDiaCalculado = 'NÃO INICIADO';

          const visitasProgramadas = tarefas.filter(t => {
            if (!t.cTitle) return false;
            const tituloUpper = String(t.cTitle).toUpperCase();
            return !tituloUpper.includes('DC VISIT') && !tituloUpper.includes('INÍCIO') && !tituloUpper.includes('FIM');
          });

          temVisita = visitasProgramadas.length > 0;

          if (temVisita) {
            const temPendente = visitasProgramadas.some(t => {
              const status = String(t.xTaskStatus).trim().toUpperCase();
              return status === 'WTM001' || status === 'WTM002';
            });
            visitasFinalizadas = !temPendente;
          }

          const dcVisits = tarefas.filter(t => {
            if (!t.cTitle) return false;
            const tituloUpper = String(t.cTitle).toUpperCase();
            return tituloUpper.includes('DC VISIT') || tituloUpper.includes('INÍCIO') || tituloUpper.includes('FIM');
          });

          const taskInicio = dcVisits.find(t => t.nSeq != null && Number(t.nSeq) === 0);
          const taskFim = dcVisits.find(t => t.nSeq != null && Number(t.nSeq) > 0);
          
          const statusInicio = taskInicio?.xTaskStatus ? String(taskInicio.xTaskStatus).trim().toUpperCase() : null;
          const statusFim = taskFim?.xTaskStatus ? String(taskFim.xTaskStatus).trim().toUpperCase() : null;

          if (statusInicio === 'WTM003' && statusFim === 'WTM003') {
            statusDiaCalculado = 'FINALIZADO';
          } else if (statusInicio === 'WTM003' && statusFim === 'WTM001') {
            statusDiaCalculado = 'INICIADO';
          } else if (statusInicio === 'WTM001' && statusFim === 'WTM001') {
            statusDiaCalculado = 'NÃO INICIADO';
          } else if (statusInicio === 'WTM003' && !statusFim) {
            statusDiaCalculado = 'INICIADO';
          } else if (statusInicio === 'WTM001' && !statusFim) {
             statusDiaCalculado = 'NÃO INICIADO';
          } else if (statusInicio === 'WTM002') {
             statusDiaCalculado = 'INÍCIO EM AND.';
          } else {
             statusDiaCalculado = 'SEM STATUS DEFINIDO';
          }
          
          fullData.temVisitaProgramada = temVisita;
          fullData.visitasFinalizadas = visitasFinalizadas; 
          fullData.statusInicioDia = statusDiaCalculado;

        } catch (e) {
          console.error("🚨 Erro nas tarefas:", e);
          fullData.statusInicioDia = 'ERRO';
        }

        try {
          const queryVisit = getCurrentVisitQuery(rotaBusca, company);
          const resVisit = await electronAPIService.executeSelect(queryVisit, savedDb, savedServer);
          if (isQueryCancelled.current) return;
          fullData.ultimaVisita = resVisit.success && resVisit.data.length > 0 ? resVisit.data[0] : null;
        } catch (e) {
          fullData.ultimaVisita = null;
        }

        try {
          const queryManifest = getManifestQuery(rotaBusca, company);
          const resManifest = await electronAPIService.executeSelect(queryManifest, savedDb, savedServer);
          if (isQueryCancelled.current) return;
          fullData.manifesto = resManifest.success && resManifest.data.length > 0 ? resManifest.data[0] : null;
        } catch (e) {
          fullData.manifesto = null;
        }

        try {
          const queryInventory = getInventoryQuery(rotaBusca, company);
          const resInventory = await electronAPIService.executeSelect(queryInventory, savedDb, savedServer);
          if (isQueryCancelled.current) return;
          fullData.inventario = resInventory.success && resInventory.data.length > 0 ? resInventory.data[0] : null;
        } catch (e) {
          fullData.inventario = null;
        }

        if (rotaIsPVV) {
          try {
            const queryPvvOrders = getPvvOrdersQuery(rotaBusca, company);
            const resPvvOrders = await electronAPIService.executeSelect(queryPvvOrders, savedDb, savedServer);
            if (isQueryCancelled.current) return;
            fullData.listaPedidos = (resPvvOrders.success) ? resPvvOrders.data : [];
          } catch (e) {
            fullData.listaPedidos = [];
          }
          fullData.listaNotas = [];
        } else {
          try {
            const queryInvoiceList = getInvoiceListQuery(rotaBusca, company);
            const resInvoices = await electronAPIService.executeSelect(queryInvoiceList, savedDb, savedServer);
            if (isQueryCancelled.current) return;
            fullData.listaNotas = (resInvoices.success) ? resInvoices.data : [];
          } catch (e) {
            fullData.listaNotas = [];
          }
          fullData.listaPedidos = [];
        }

       try {
          const queryLiquidate = getLiquidateQuery(rotaBusca, company);
          const resLiquidate = await electronAPIService.executeSelect(queryLiquidate, savedDb, savedServer);
          if (isQueryCancelled.current) return;
          
          if (resLiquidate.success && resLiquidate.data && resLiquidate.data.length > 0) {
            fullData.liquidate = resLiquidate.data[0].cIDLiquidate;
          } else {
            fullData.liquidate = null;
          }
        } catch (e) {
          fullData.liquidate = null;
        }

        setRouteData(fullData);
        setQueryStatus('success');
      } else {
        setRouteData(null); 
        setErrorMessage("Rota não encontrada! Verifique se o código ou o banco de dados estão corretos.");
        setQueryStatus('error');
      }
    } catch (error) {
      setRouteData(null);
      setErrorMessage("Erro de conexão com o banco de dados. Tente novamente.");
      setQueryStatus('error');
    } finally {
      setLoading(false);
      clearTimeoutRef();
    }
  };

  return {
    // exportando os hooks
    rota, setRota,
    selectedServer, setSelectedServer,
    loading, routeData, searchAttempted, historico,
    handleBuscarRota,
    handleCancelRoute,
    queryStatus,
    errorMessage,
    t,
    isConnectionModalOpen, setIsConnectionModalOpen,
    selectedMuidData, setSelectedMuidData,
    isMuidLoading,
    handleSaveConnection,
    handleVerMuid,
    
    selectedEodData, setSelectedEodData,
    isEodLoading, handleVerEod
  };
};