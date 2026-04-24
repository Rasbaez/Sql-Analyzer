export const validateEodData = (eod) => {
  let parsed;
  let alerts = [];

  try {
    parsed = JSON.parse(eod.cJson);
  } catch (err) {
    return { ...eod, alerts: [{ msg: 'JSON inválido ou corrompido no EOD', type: 'error' }] };
  }

  const GPID = parsed.UserID || '';
  const trip = eod.cIDTrip || parsed.TourID || '-';
  const liq = eod.cIDLiquidate;
  const ts = new Date(eod.mc1LastUpdate).toLocaleString('pt-BR');

  // Regra 1: Chave RACOCIH Vazia
  const racocih = parsed.ZLLATCOM_RACOCIH || [];
  if (racocih.length === 0) {
    alerts.push({ msg: 'Chave ZLLATCOM_RACOCIH vazia (EOD sem vendas/não processado no SAP).', type: 'error' });
  }

  // Regra 2: UserID Vazio
  const userIDempty = !parsed.UserID;
  if (userIDempty) {
    alerts.push({ msg: 'Chave UserID está vazia. Validar se o usuário finalizou o dia.', type: 'warning' });
  }

  // Regra 3: Visitas Duplicadas
  const arrVisitSeq = (parsed.ZLLATCOM_RACTRL_DOC || [])
    .filter(d => d.DocumentType === 'CUS_VIS')
    .map(d => d.VisitID);
  
  const repeatedValues = arrVisitSeq.filter((v, i, a) => a.indexOf(v) !== i);
  if (repeatedValues.length) {
    const uniques = [...new Set(repeatedValues)];
    alerts.push({ msg: `EOD com visitas duplicadas (${uniques.join(', ')}). Corrigir sequência e reexportar!`, type: 'error' });
  }

  // Contagem de itens e Danfinhas
  const ordersQty = parsed.OrdersQty || 0;
  const arrProducts = racocih.length > 0 ? (racocih[0].ZLLATCOM_RACOCIM || []) : [];
  const totalOfItems = arrProducts.reduce((acc, p) => acc + (p.TargetQty || 0), 0);

  return {
    ...eod,
    parsedJson: parsed,
    alerts,
    extracted: { GPID, trip, liq, ts, ordersQty, totalOfItems }
  };
};