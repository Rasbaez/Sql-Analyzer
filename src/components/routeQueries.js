// ==========================================
// 🗄️ REPOSITÓRIO DE QUERIES - ANÁLISE DE ROTA
// ==========================================

// 🔥 QUERY MASTER: Agora trazendo a coluna mc1enabled para o React ler!
// 🔥 QUERY MASTER: Busca a rota e APENAS usuários que estejam ativos!
export const getMasterQuery = (rotaBusca, company) => `
  SELECT TOP 1 
    T.cIDTerritory, T.cIDCompany, T.cIDCommercialHierarchyChild, T.cIDCommercialHierarchyParent,
    U.cUserName, U.cIDUser,
    UT.mc1Enabled AS mc1enabled,
    TE.dLastClosure, TE.dLastInventory, TE.dLastFinancial,
    MU.cidCustomerUser AS YG05,
    BIC.cCityName, BIT.cidbranchinvoice, BIC.cNeighborhood, BIC.cStateName, TE.xRouteType
  FROM mc1_Territory T WITH (NOLOCK)
  LEFT JOIN mc1_TerritoryExt TE WITH (NOLOCK) ON T.cIDTerritory = TE.cIDTerritory AND T.cIDCompany = TE.cIDCompany
  
  -- 🛡️ O SEGREDO ESTÁ AQUI: O JOIN já filtra procurando apenas quem tem 1. 
  -- Se não achar, a Rota vem, mas o usuário vem como NULL.
  LEFT JOIN mc1_UserTerritory UT WITH (NOLOCK) 
    ON UT.cIDTerritory = T.cIDTerritory 
    AND UT.cIDCompany = T.cIDCompany 
    AND UT.mc1Enabled = 1 

  LEFT JOIN mc1_User U WITH (NOLOCK) ON U.cIDUser = UT.cIDUser AND U.cIDCompany = UT.cIDCompany
  LEFT JOIN MC1_BranchInvoiceTerritory BIT WITH (NOLOCK) ON BIT.cIDTerritory = T.cIDTerritory AND BIT.cIDCompany = T.cIDCompany
  LEFT JOIN mc1_masterUserExt MU WITH (NOLOCK) ON MU.cIDUser = U.cIDUser AND MU.cIDCompany = U.cIDCompany
  LEFT JOIN MC1_BranchInvoiceComplementaryext BIC WITH (NOLOCK) ON BIC.cIDBranchInvoice = BIT.cIDBranchInvoice AND BIC.cIDCompany = BIT.cIDCompany
  WHERE T.cIDTerritory = '${rotaBusca}' AND T.cIDCompany = '${company}'
`;

export const getTasksQuery = (rotaBusca) => `
  SELECT 
    xTaskStatus,
    cTitle,
    nSeq
  FROM MC1_Tasks WITH(NOLOCK)
  WHERE cIDTerritory = '${rotaBusca}' 
    -- 🔥 SARGability: Uso correto de índices de data
    AND dTask >= CAST(GETDATE() AS DATE)
    AND dTask < CAST(DATEADD(day, 1, GETDATE()) AS DATE)
    AND mc1Enabled = 1
`;

export const getSalesSummaryQuery = (rotaBusca, company) => `
  SELECT 
    COUNT(DISTINCT o.cIDOrder) as QtdPedidos,
    ISNULL(SUM(CAST(oe.ntotalNetValue as decimal(15, 2))), 0) as ValorTotalLiquido
  FROM MC1_Order o WITH (NOLOCK)
  INNER JOIN MC1_OrderExt oe WITH (NOLOCK) ON oe.cIDOrder = o.cIDOrder AND oe.cIDCompany = o.cIDCompany
  WHERE o.cIDTerritory = '${rotaBusca}' 
    AND o.cIDCompany = '${company}'
    -- 🔥 SARGability
    AND o.dCreated >= CAST(GETDATE() AS DATE)
    AND o.dCreated < CAST(DATEADD(day, 1, GETDATE()) AS DATE)
`;

export const getInvoiceListQuery = (rotaBusca, company) => `
  SELECT 
    ie.cIDInvoice,
    ie.cSerie,
    c.cCustomerShortName,
    ie.cInvoiceStatus,
    ie.dQueue,
    ie.dExport
  FROM MC1_Order o WITH (NOLOCK)
  INNER JOIN MC1_OrderInvoice oi WITH (NOLOCK) ON oi.cIDOrder = o.cIDOrder AND oi.cIDCompany = o.cIDCompany
  INNER JOIN MC1_InvoiceExt ie WITH (NOLOCK) ON ie.cIDInvoice = oi.cIDInvoice AND ie.cSerie = oi.cSerie AND ie.cIDBranchInvoice = oi.cIDBranchInvoice AND ie.cIDCompany = oi.cIDCompany
  INNER JOIN MC1_Customer c WITH (NOLOCK) ON c.cIDCustomer = o.cIDCustomer AND c.cIDCompany = o.cIDCompany
  WHERE o.cIDTerritory = '${rotaBusca}' 
    AND o.cIDCompany = '${company}'
    -- 🔥 SARGability
    AND o.dCreated >= CAST(GETDATE() AS DATE)
    AND o.dCreated < CAST(DATEADD(day, 1, GETDATE()) AS DATE)
  ORDER BY ie.dEmission DESC
`;

export const getInventoryQuery = (rotaBusca, company) => `
  SELECT 
    COUNT(DISTINCT cIDProduct) as QtdSKUs,
    ISNULL(SUM(CAST(nAmount AS FLOAT)), 0) as QtdTotalFisica,
    MAX(dBalance) as dBalance
  FROM MC1_StockBalance WITH (NOLOCK)
  WHERE cIDTerritory = '${rotaBusca}' 
    AND cIDCompany = '${company}'
    AND mc1Enabled = 1
    -- 🔥 SARGability: Filtra apenas o inventário atualizado HOJE
    AND dBalance >= CAST(GETDATE() AS DATE)
    AND dBalance < CAST(DATEADD(day, 1, GETDATE()) AS DATE)
`;


// 🔥 QUERY: PEDIDOS PVV (Adaptada com as regras de negócio que você mandou)
export const getPvvOrdersQuery = (rotaBusca, company) => `
  SELECT 
    o.cIDOrder,
    c.cCustomerShortName,
    IIF(o.xOrderType = 'WTM023', 'Venda',
      IIF(o.xOrderType = 'WTM020', 'Não venda',
      IIF(o.xOrderType = 'WTM021', 'Pedido de carga',
      IIF(o.xOrderType = 'WTMFAB', 'Corte de Veiculo',
      IIF(o.xOrderType = 'WTMFAS', 'Corte Fiscal', 'Outro'))))) as TipoPedido,
    IIF(o.xOrderStatus = 'WTM005', 'Cancelado',
      IIF(o.xOrderStatus = 'WTM006', 'Finalizado', 'Outro')) as StatusPedido,
    o.dExport,
    o.dCreated
  FROM MC1_Order o WITH (NOLOCK)
  INNER JOIN MC1_OrderExt oe WITH (NOLOCK) ON o.cIDOrder = oe.cIDOrder AND o.cIDCompany = oe.cIDCompany
  LEFT JOIN MC1_Customer c WITH (NOLOCK) ON c.cIDCustomer = o.cIDCustomer AND c.cIDCompany = o.cIDCompany
  WHERE o.cIDTerritory = '${rotaBusca}' 
    AND o.cIDCompany = '${company}'
    -- 🔥 SARGability
    AND o.dCreated >= CAST(GETDATE() AS DATE)
    AND o.dCreated < CAST(DATEADD(day, 1, GETDATE()) AS DATE)
  ORDER BY o.dCreated DESC
`;

export const getCurrentVisitQuery = (rotaBusca, company) => `
  SELECT TOP 1 
    CASE ci.xCheckInOutType
      WHEN 'WTM003' THEN 'Depósito Bancário' WHEN 'WTM007' THEN 'Cliente' WHEN 'WTM009' THEN 'Visita de propósito geral'
      WHEN 'WTM010' THEN 'DC Início de dia' WHEN 'WTM011' THEN 'DC Fim de dia' WHEN 'WTM013' THEN 'DC Fim de dia automático'
      WHEN 'WTM014' THEN 'Almoço' ELSE 'Outro'
    END AS TipoCheckIn,
    CASE t.xTaskStatus
      WHEN 'WTM001' THEN 'Não iniciada' WHEN 'WTM002' THEN 'Em andamento' 
      WHEN 'WTM003' THEN 'Concluída' WHEN 'WTM004' THEN 'Cancelada' ELSE 'Outro'
    END AS StatusTarefa,
    ci.dCheckin,
    ci.dCheckout,
    t.cIDCustomer,
    c.cCustomerShortName
  FROM MC1_Tasks t WITH(NOLOCK)
  INNER JOIN MC1_TasksResult tr WITH(NOLOCK) ON tr.cIDTask = t.cIDTask AND tr.cIDCompany = t.cIDCompany
  INNER JOIN MC1_CheckInOut ci WITH(NOLOCK) ON ci.cIDCheckInOut = tr.cIDCheckInOut AND ci.cIDCompany = tr.cIDCompany
  LEFT JOIN MC1_Customer c WITH(NOLOCK) ON t.cIDCustomer = c.cIDCustomer AND c.cIDCompany = t.cIDCompany
  WHERE t.cIDTerritory = '${rotaBusca}'
    AND t.cIDCompany = '${company}'
    -- 🔥 FILTRO MATADOR: Bloqueia a leitura do passado já na tabela raiz!
    AND t.dTask >= CAST(GETDATE() AS DATE)
    AND t.dTask < CAST(DATEADD(day, 1, GETDATE()) AS DATE)
  ORDER BY ci.dCheckin DESC
`;


// 🔥 NOVA QUERY: STATUS DOS MANIFESTOS (Carga)
export const getManifestQuery = (rotaBusca, company) => `
DECLARE @MaxDmanifestCreated DATETIME = (SELECT MAX(dManifestCreated) FROM MC1_ManifestExt WITH(NOLOCK) WHERE cIDTerritory = '${rotaBusca}' AND cIDCompany = '${company}'
 AND dManifestCreated > CAST(GETDATE() -60 AS DATE) 
);

  SELECT TOP 1
    m.nManifest,
    m.cManifestType,
    m.mc1Enabled,
    m.lApproval,
    m.dManifestCreated,
    m.dLotCreated
  FROM MC1_ManifestExt m WITH(NOLOCK)
  WHERE m.cIDTerritory = '${rotaBusca}' 
    AND m.cIDCompany = '${company}'
    AND m.dManifestCreated > CAST(GETDATE() -60 AS DATE)
    AND m.dManifestCreated = @MaxDmanifestCreated
`;

// 🔥 QUERY 7: Busca o Liquidate (Fechamento / EndOfDay) da Rota (AGORA RESTRITO A HOJE)
export const getLiquidateQuery = (rotaBusca, company) => `
  SELECT TOP 1 TE.cIDLiquidate
  FROM MC1_Tasks T WITH(NOLOCK) 
  INNER JOIN MC1_TasksExt TE WITH(NOLOCK) 
    ON T.cIDCompany = TE.cIDCompany 
    AND T.xIDTaskType = TE.xIDTaskType 
    AND T.cIDTask = TE.cIDTask
  WHERE T.cIDTerritory = '${rotaBusca}' 
    AND T.cIDCompany = '${company}'
    AND TE.cIDLiquidate IS NOT NULL
    AND T.xIDTaskType = 'WTM008' 
    AND T.nSeq > 0 
    -- 🔥 FILTRO ESSENCIAL ADICIONADO AQUI:
    AND T.dTask >= CAST(GETDATE() AS DATE) 
  ORDER BY TE.cIDTrip DESC
`;