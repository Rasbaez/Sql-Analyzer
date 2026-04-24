// 📄 src/utils/helpers/mongoHelpers.js

export const validateInvoiceData = (nf) => {
  const alerts = [];
  let parsedJson = {};

  try {
    parsedJson = JSON.parse(nf.cJson);
  } catch (e) {
    return { ...nf, alerts: [{ type: 'critical', msg: 'JSON corrompido' }], parsedJson: {} };
  }

  const { Cust_Ordr_Line: lines, NFE_STS, DLVRY_RQSTD_DTM, ORDR_NET_TOT_AMT } = parsedJson;
  const totalOfKeys = Object.keys(parsedJson).length;

  // Validações
  if (!lines || lines.length === 0) {
    alerts.push({ type: 'error', msg: "Cust_Ordr_Line vazia/nula (Não integrada no SAP)" });
  } else {
    // Duplicados
    const seen = new Set();
    lines.forEach(item => {
      if (seen.has(item.MTRL_ID)) alerts.push({ type: 'warning', msg: `Item duplicado: ${item.MTRL_ID}` });
      else seen.add(item.MTRL_ID);
    });
    // Impostos
    if (lines[0]?.Taxes?.length === 0) alerts.push({ type: 'warning', msg: "Taxes vazias (Sem impostos)" });
  }

  if (NFE_STS === 'AS') alerts.push({ type: 'inactive', msg: 'Nota Inativa' });
  if (!DLVRY_RQSTD_DTM) alerts.push({ type: 'error', msg: 'dExpectedDelivery é NULL' });
  else if (DLVRY_RQSTD_DTM.includes('1900')) alerts.push({ type: 'critical', msg: 'Ano 1900 (Atualizar MC1_ORDER)' });
  
  if (totalOfKeys < 78) alerts.push({ type: 'error', msg: `Faltam chaves (${totalOfKeys}/78). REEXPORTAR!` });

  return {
    ...nf,
    alerts,
    parsedJson,
    formattedValue: ORDR_NET_TOT_AMT?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'
  };
};