// 🧰 routeUtils.js - Funções de Apoio e Formatação

export const databaseList = [
  'BO_WTM_PEPSICO_BR', 'BO_WTM_PEPSICO', 'BO_WTM_PEPSICO_CASA', 'BO_WTM_ETL_PEPSICO'
];

export const getCompanyId = (dbName) => {
  switch (dbName) {
    case 'BO_WTM_PEPSICO_BR': return '0546';
    case 'BO_WTM_PEPSICO': return '0545'; 
    default: return '0546';
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return 'Não registrado';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
  } catch (e) {
    return dateString;
  }
};

export const renderTaskStatus = (statusCalculado) => {
  if (statusCalculado === 'FINALIZADO') return { texto: 'DIA FINALIZADO', classe: 'kpi-dark', icone: '🏁' };
  if (statusCalculado === 'INICIADO') return { texto: 'INICIADO', classe: 'kpi-success', icone: '☀️' };
  if (statusCalculado === 'INÍCIO EM AND.') return { texto: 'INÍCIO EM AND.', classe: 'kpi-warning', icone: '⏳' };
  if (statusCalculado === 'NÃO INICIADO') return { texto: 'NÃO INICIADO', classe: 'kpi-danger', icone: '🌙' };
  return { texto: 'SEM ROTA HOJE', classe: 'kpi-dark', icone: '🚫' }; 
};

export const getManifestStatus = (m) => {
  if (!m) return { text: 'Nenhum manifesto recente', color: '#64748b' };

  const isEnabled = (m.mc1Enabled === 1 || m.mc1Enabled === true || m.mc1Enabled === '1');
  const isApproved = (m.lApproval === 1 || m.lApproval === true || m.lApproval === '1');
  const isApprovalNull = (m.lApproval == null || m.lApproval === ''); 

  if (isEnabled && isApprovalNull) return { text: 'AGUARDANDO ACEITE', color: '#d97706', alert: true };
  if (isEnabled && isApproved) return { text: 'ACEITO (EM USO)', color: '#16a34a', alert: false };
  if (!isEnabled && isApprovalNull) return { text: 'REJEITADO', color: '#dc2626', alert: true };
  if (!isEnabled && isApproved) return { text: 'DESATIVADO (FECHADO)', color: '#64748b', alert: false };
  
  return { text: 'STATUS DESCONHECIDO', color: '#64748b', alert: false };
};