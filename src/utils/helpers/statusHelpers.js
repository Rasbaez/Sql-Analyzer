// 📄 src/utils/helpers/statusHelpers.js
import React from 'react';
import { CheckCircle, AlertTriangle, Edit3, XCircle, X, Ghost } from 'lucide-react';

// Centraliza as configurações de status para os Grupos (Cards)
export const getGroupStatusInfo = (group) => {
  if (group.successCount > 0) {
    if (group.hasEdit) return { label: 'Autorizada (Após Edição)', className: 'badge-success', type: 'SUCCESS_EDIT', icon: <CheckCircle size={12}/> };
    if (group.hasCancellation) return { label: 'Autorizada (Após Cancel.)', className: 'badge-success', type: 'SUCCESS_CANCEL', icon: <CheckCircle size={12}/> };
    return { label: 'Autorizada', className: 'badge-success', type: 'SUCCESS', icon: <CheckCircle size={12}/> };
  }
  
  if (group.contingencyCount > 0) return { label: 'Autorizada em Contingência', className: 'badge-contingency', type: 'CONTINGENCY', icon: <AlertTriangle size={12}/> };
  if (group.hasEdit) return { label: 'Edição Incompleta', className: 'badge-edit', type: 'EDIT_PENDING', icon: <Edit3 size={12}/> };
  if (group.hasCancellation) return { label: 'Cancelamento Detectado', className: 'badge-cancel', type: 'CANCEL_PENDING', icon: <XCircle size={12}/> };
  
  return { label: 'Falha', className: 'error', type: 'ERROR', icon: <X size={12}/> };
};

// Centraliza as configurações de status para as Linhas (Logs individuais)
// 🔥 Mudei o nome para getLogStatusConfig para bater com o import do seu componente
export const getLogStatusConfig = (status) => {
  const statusMap = {
    'SUCCESS': { label: 'Autorizada', color: 'text-success', icon: '✅', isGhost: false },
    'CONTINGENCY': { label: 'Contingência', color: 'text-contingency', icon: '🛟', isGhost: false },
    'EDITING': { label: 'Edição Solicitada', color: 'text-edit', icon: '📝', isGhost: false },
    'CANCELLED': { label: 'Cancelamento Homolog.', color: 'text-cancel', icon: '🛑', isGhost: false },
    'CANCELLING': { label: 'Solicitação Cancel.', color: 'text-cancelling', icon: '⚠️', isGhost: false },
    'CANCELLED_EDIT': { label: 'Cancelada p/ Edição', color: 'text-cancel-edit', icon: '✏️', isGhost: false },
    'INACTIVE_CANCELLED': { label: 'Inativa (Cancelada)', color: 'text-inactive', icon: <Ghost size={14}/>, isGhost: true },
    'INACTIVE': { label: 'Inativa / Substituída', color: 'text-inactive', icon: <Ghost size={14}/>, isGhost: true },
  };

  return statusMap[status] || { label: 'Erro / Queda', color: 'text-error', icon: '❌', isGhost: false };
};